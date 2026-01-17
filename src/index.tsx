import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== API Routes for Frontend ====================

// Submit emails for verification (optimized for bulk inserts)
app.post('/api/verify', async (c) => {
  try {
    const { emails } = await c.req.json()
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return c.json({ error: 'Invalid input. Expected array of emails.' }, 400)
    }

    // Limit to 1000 emails per batch
    if (emails.length > 1000) {
      return c.json({ error: 'Maximum 1000 emails per batch' }, 400)
    }

    const results = []
    const provider = 'office365'
    
    // Batch insert using transaction for better performance
    const batch = []
    
    for (const email of emails) {
      const emailStr = typeof email === 'string' ? email : email.email
      
      if (!emailStr || !emailStr.includes('@')) {
        results.push({ email: emailStr, error: 'Invalid email format' })
        continue
      }

      // Add to batch insert
      batch.push(emailStr)
    }

    // Bulk insert using prepared statement (much faster)
    // SQLite has a limit of 999 variables, so batch in chunks of 300 emails (300 * 3 = 900 variables)
    if (batch.length > 0) {
      const CHUNK_SIZE = 300 // 300 emails = 900 variables (safe under 999 limit)
      
      for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
        const chunk = batch.slice(i, i + CHUNK_SIZE)
        const placeholders = chunk.map(() => '(?, ?, ?)').join(',')
        const values = chunk.flatMap(email => [email, provider, 'pending'])
        
        const query = `
          INSERT OR IGNORE INTO verification_queue (email, provider, status)
          VALUES ${placeholders}
        `
        
        await c.env.DB.prepare(query).bind(...values).run()
      }
      
      // Return success for all
      for (const email of batch) {
        results.push({ 
          email, 
          provider,
          status: 'queued'
        })
      }
    }

    return c.json({ 
      success: true, 
      message: `${batch.length} emails queued for verification`,
      results 
    })
  } catch (error) {
    console.error('Error queuing emails:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ 
      error: 'Failed to queue emails', 
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, 500)
  }
})

// Get verification status for all emails (optimized for 10k+ records)
app.get('/api/status', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100')
    const offset = parseInt(c.req.query('offset') || '0')
    
    const results = await c.env.DB.prepare(`
      SELECT id, email, provider, status, result, error_message, 
             attempts, created_at, completed_at
      FROM verification_queue
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()

    // Get total count for pagination
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM verification_queue
    `).first()

    return c.json({ 
      success: true, 
      data: results.results, 
      limit, 
      offset,
      total: countResult?.total || 0
    })
  } catch (error) {
    console.error('Error fetching status:', error)
    return c.json({ error: 'Failed to fetch status' }, 500)
  }
})

// Get recent results only (fast endpoint for dashboard)
app.get('/api/status/recent', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50')
    
    const results = await c.env.DB.prepare(`
      SELECT id, email, provider, status, result, 
             attempts, created_at, completed_at
      FROM verification_queue
      ORDER BY id DESC
      LIMIT ?
    `).bind(limit).all()

    return c.json({ success: true, data: results.results })
  } catch (error) {
    console.error('Error fetching recent results:', error)
    return c.json({ error: 'Failed to fetch recent results' }, 500)
  }
})

// Get statistics
app.get('/api/stats', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN result = 'valid' THEN 1 ELSE 0 END) as valid,
        SUM(CASE WHEN result = 'strong_bounce' THEN 1 ELSE 0 END) as strong_bounce,
        SUM(CASE WHEN result = 'error' THEN 1 ELSE 0 END) as errors
      FROM verification_queue
    `).first()

    return c.json({ success: true, stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// Export valid emails
app.get('/api/export/valid', async (c) => {
  try {
    const validEmails = await c.env.DB.prepare(`
      SELECT email, created_at, completed_at
      FROM verification_queue
      WHERE result = 'valid'
      ORDER BY completed_at DESC
    `).all()

    // Return as plain text (one email per line)
    const emailList = validEmails.results.map((row: any) => row.email).join('\n')
    
    return new Response(emailList, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="valid-emails.txt"'
      }
    })
  } catch (error) {
    console.error('Error exporting valid emails:', error)
    return c.json({ error: 'Failed to export valid emails' }, 500)
  }
})

// Export invalid emails (strong bounces)
app.get('/api/export/invalid', async (c) => {
  try {
    const invalidEmails = await c.env.DB.prepare(`
      SELECT email, created_at, completed_at
      FROM verification_queue
      WHERE result = 'strong_bounce'
      ORDER BY completed_at DESC
    `).all()

    // Return as plain text (one email per line)
    const emailList = invalidEmails.results.map((row: any) => row.email).join('\n')
    
    return new Response(emailList, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="invalid-emails.txt"'
      }
    })
  } catch (error) {
    console.error('Error exporting invalid emails:', error)
    return c.json({ error: 'Failed to export invalid emails' }, 500)
  }
})

// Clear all data (for testing)
app.delete('/api/clear', async (c) => {
  try {
    await c.env.DB.prepare('DELETE FROM verification_queue').run()
    await c.env.DB.prepare('DELETE FROM verification_results').run()
    return c.json({ success: true, message: 'All data cleared' })
  } catch (error) {
    console.error('Error clearing data:', error)
    return c.json({ error: 'Failed to clear data' }, 500)
  }
})

// ==================== API Routes for VPS Worker ====================

// Middleware to check API token
const checkApiToken = async (c: any, next: any) => {
  const token = c.req.header('X-API-Token')
  
  if (!token) {
    return c.json({ error: 'API token required' }, 401)
  }

  const result = await c.env.DB.prepare(`
    SELECT id, is_active FROM api_tokens WHERE token = ?
  `).bind(token).first()

  if (!result || !result.is_active) {
    return c.json({ error: 'Invalid or inactive API token' }, 403)
  }

  // Update last_used_at
  await c.env.DB.prepare(`
    UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token = ?
  `).bind(token).run()

  await next()
}

// Get next pending verification job
app.get('/api/worker/next', checkApiToken, async (c) => {
  try {
    // Get oldest pending job
    const job = await c.env.DB.prepare(`
      SELECT id, email, provider
      FROM verification_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    `).first()

    if (!job) {
      return c.json({ success: true, job: null })
    }

    // Mark as processing
    await c.env.DB.prepare(`
      UPDATE verification_queue 
      SET status = 'processing', 
          attempts = attempts + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(job.id).run()

    return c.json({ success: true, job })
  } catch (error) {
    console.error('Error fetching next job:', error)
    return c.json({ error: 'Failed to fetch next job' }, 500)
  }
})

// Submit verification result
app.post('/api/worker/result', checkApiToken, async (c) => {
  try {
    const { id, result, error_message, details } = await c.req.json()

    if (!id || !result) {
      return c.json({ error: 'Job ID and result are required' }, 400)
    }

    // Update verification queue
    await c.env.DB.prepare(`
      UPDATE verification_queue 
      SET status = 'completed',
          result = ?,
          error_message = ?,
          updated_at = CURRENT_TIMESTAMP,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(result, error_message || null, id).run()

    // Get email and provider for results table
    const job = await c.env.DB.prepare(`
      SELECT email, provider FROM verification_queue WHERE id = ?
    `).bind(id).first()

    if (job && result !== 'error') {
      // Insert into results table
      await c.env.DB.prepare(`
        INSERT INTO verification_results (email, provider, result, details)
        VALUES (?, ?, ?, ?)
      `).bind(job.email, job.provider, result, details || null).run()
    }

    return c.json({ success: true, message: 'Result submitted' })
  } catch (error) {
    console.error('Error submitting result:', error)
    return c.json({ error: 'Failed to submit result' }, 500)
  }
})

// Get worker statistics
app.get('/api/worker/stats', checkApiToken, async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_jobs
      FROM verification_queue
    `).first()

    return c.json({ success: true, stats })
  } catch (error) {
    console.error('Error fetching worker stats:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

// ==================== Frontend ====================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verifier - Office365 & Gmail</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .status-pending { background-color: #FEF3C7; color: #92400E; }
          .status-processing { background-color: #DBEAFE; color: #1E40AF; }
          .status-completed { background-color: #D1FAE5; color: #065F46; }
          .status-failed { background-color: #FEE2E2; color: #991B1B; }
          .result-valid { background-color: #D1FAE5; color: #065F46; }
          .result-invalid { background-color: #FEE2E2; color: #991B1B; }
          .result-bounce { background-color: #FECACA; color: #7F1D1D; }
          .result-error { background-color: #FED7AA; color: #9A3412; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <!-- Header -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            <i class="fas fa-envelope-circle-check text-blue-600 mr-2"></i>
                            Email Verifier
                        </h1>
                        <p class="text-gray-600">Office365 & Gmail Email Existence Verification</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">Status</div>
                        <div id="connection-status" class="text-green-600 font-semibold">
                            <i class="fas fa-circle text-green-500 animate-pulse"></i> Connected
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistics Cards -->
            <div id="stats-container" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <!-- Stats will be loaded here -->
            </div>

            <!-- Input Section -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-paper-plane mr-2"></i>
                    Add Emails for Verification
                </h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Enter email addresses (one per line)
                    </label>
                    <textarea 
                        id="email-input" 
                        class="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="user@outlook.com&#10;another@gmail.com&#10;test@hotmail.com&#10;demo@live.com"
                    ></textarea>
                    <p class="text-xs text-gray-500 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        No passwords needed - we check if email accounts exist by testing login page responses
                    </p>
                </div>

                <div class="flex gap-3">
                    <button 
                        id="verify-btn" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
                    >
                        <i class="fas fa-check-circle mr-2"></i>
                        Start Verification
                    </button>
                    <button 
                        id="export-valid-btn" 
                        class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                        <i class="fas fa-download mr-2"></i>
                        Export Valid
                    </button>
                    <button 
                        id="export-invalid-btn" 
                        class="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                        <i class="fas fa-file-export mr-2"></i>
                        Export Invalid
                    </button>
                    <button 
                        id="clear-btn" 
                        class="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                    >
                        <i class="fas fa-trash mr-2"></i>
                        Clear All
                    </button>
                </div>
            </div>

            <!-- Results Section -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-list-check mr-2"></i>
                        Verification Results
                    </h2>
                    <button 
                        id="refresh-btn" 
                        class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
                    >
                        <i class="fas fa-sync mr-2"></i>
                        Refresh
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Result</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attempts</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody id="results-body" class="divide-y divide-gray-200">
                            <tr>
                                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                                    <i class="fas fa-inbox text-4xl mb-2 opacity-50"></i>
                                    <p>No verification results yet. Add emails above to get started.</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
