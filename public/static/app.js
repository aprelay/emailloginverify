// API Base URL
const API_BASE = '';

// State
let refreshInterval = null;

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

// Get status badge HTML
function getStatusBadge(status) {
  const badges = {
    pending: '<span class="status-badge status-pending"><i class="fas fa-clock mr-1"></i>Pending</span>',
    processing: '<span class="status-badge status-processing"><i class="fas fa-spinner fa-spin mr-1"></i>Processing</span>',
    completed: '<span class="status-badge status-completed"><i class="fas fa-check mr-1"></i>Completed</span>',
    failed: '<span class="status-badge status-failed"><i class="fas fa-times mr-1"></i>Failed</span>'
  };
  return badges[status] || status;
}

// Get result badge HTML
function getResultBadge(result) {
  if (!result) return '<span class="text-gray-400">-</span>';
  
  const badges = {
    valid: '<span class="status-badge result-valid"><i class="fas fa-check-circle mr-1"></i>Valid</span>',
    invalid: '<span class="status-badge result-invalid"><i class="fas fa-times-circle mr-1"></i>Invalid</span>',
    strong_bounce: '<span class="status-badge result-bounce"><i class="fas fa-exclamation-triangle mr-1"></i>Strong Bounce</span>',
    error: '<span class="status-badge result-error"><i class="fas fa-bug mr-1"></i>Error</span>'
  };
  return badges[result] || result;
}

// Load statistics
async function loadStats() {
  try {
    const response = await axios.get(`${API_BASE}/api/stats`);
    const { stats } = response.data;

    const statsHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Total</p>
            <p class="text-3xl font-bold text-gray-800">${stats.total || 0}</p>
          </div>
          <div class="bg-blue-100 p-3 rounded-full">
            <i class="fas fa-envelope text-2xl text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Pending</p>
            <p class="text-3xl font-bold text-yellow-600">${stats.pending || 0}</p>
          </div>
          <div class="bg-yellow-100 p-3 rounded-full">
            <i class="fas fa-clock text-2xl text-yellow-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Valid</p>
            <p class="text-3xl font-bold text-green-600">${stats.valid || 0}</p>
          </div>
          <div class="bg-green-100 p-3 rounded-full">
            <i class="fas fa-check-circle text-2xl text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm mb-1">Bounces</p>
            <p class="text-3xl font-bold text-red-600">${stats.strong_bounce || 0}</p>
          </div>
          <div class="bg-red-100 p-3 rounded-full">
            <i class="fas fa-exclamation-triangle text-2xl text-red-600"></i>
          </div>
        </div>
      </div>
    `;

    document.getElementById('stats-container').innerHTML = statsHTML;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load results
async function loadResults() {
  try {
    const response = await axios.get(`${API_BASE}/api/status`);
    const { data } = response.data;

    const tbody = document.getElementById('results-body');

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-8 text-center text-gray-500">
            <i class="fas fa-inbox text-4xl mb-2 opacity-50"></i>
            <p>No verification results yet. Add emails above to get started.</p>
          </td>
        </tr>
      `;
      return;
    }

    const rows = data.map(item => `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 text-sm font-medium text-gray-900">${item.email}</td>
        <td class="px-4 py-3 text-sm text-gray-600">
          ${item.provider === 'office365' 
            ? '<i class="fab fa-microsoft text-blue-600 mr-1"></i>Office365' 
            : '<i class="fab fa-google text-red-600 mr-1"></i>Gmail'}
        </td>
        <td class="px-4 py-3 text-sm">${getStatusBadge(item.status)}</td>
        <td class="px-4 py-3 text-sm">${getResultBadge(item.result)}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${item.attempts || 0}</td>
        <td class="px-4 py-3 text-sm text-gray-600">${formatDate(item.created_at)}</td>
      </tr>
    `).join('');

    tbody.innerHTML = rows;
  } catch (error) {
    console.error('Error loading results:', error);
  }
}

// Submit emails for verification
async function submitEmails() {
  const input = document.getElementById('email-input').value.trim();
  
  if (!input) {
    alert('Please enter at least one email address');
    return;
  }

  const lines = input.split('\n').filter(line => line.trim());
  const emails = [];

  for (const line of lines) {
    const email = line.trim();
    if (email && email.includes('@')) {
      emails.push(email);
    }
  }

  if (emails.length === 0) {
    alert('No valid email addresses found. Please enter valid emails (e.g., user@gmail.com)');
    return;
  }

  const btn = document.getElementById('verify-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

  try {
    const response = await axios.post(`${API_BASE}/api/verify`, { emails });
    
    if (response.data.success) {
      alert(`Success! ${response.data.message}`);
      document.getElementById('email-input').value = '';
      await loadStats();
      await loadResults();
      
      // Start auto-refresh
      if (!refreshInterval) {
        refreshInterval = setInterval(() => {
          loadStats();
          loadResults();
        }, 3000);
      }
    }
  } catch (error) {
    console.error('Error submitting emails:', error);
    alert('Error: ' + (error.response?.data?.error || error.message));
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Start Verification';
  }
}

// Export valid emails
async function exportValid() {
  try {
    // Trigger download
    window.location.href = `${API_BASE}/api/export/valid`;
  } catch (error) {
    console.error('Error exporting valid emails:', error);
    alert('Error exporting valid emails');
  }
}

// Clear all data
async function clearAll() {
  if (!confirm('Are you sure you want to clear all verification data? This cannot be undone.')) {
    return;
  }

  try {
    await axios.delete(`${API_BASE}/api/clear`);
    alert('All data cleared successfully');
    await loadStats();
    await loadResults();
  } catch (error) {
    console.error('Error clearing data:', error);
    alert('Error: ' + (error.response?.data?.error || error.message));
  }
}

// Event listeners
document.getElementById('verify-btn').addEventListener('click', submitEmails);
document.getElementById('export-btn').addEventListener('click', exportValid);
document.getElementById('clear-btn').addEventListener('click', clearAll);
document.getElementById('refresh-btn').addEventListener('click', () => {
  loadStats();
  loadResults();
});

// Initial load
loadStats();
loadResults();

// Auto-refresh every 5 seconds
setInterval(() => {
  loadStats();
  loadResults();
}, 5000);
