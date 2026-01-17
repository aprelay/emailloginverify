#!/bin/bash

# GitHub Push Script for emailloginverify
# Run this on your local machine after downloading the project

echo "🚀 Pushing to GitHub: aprelay/emailloginverify"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project directory?"
    exit 1
fi

# Configure git (if not already configured)
git config user.email "your-email@example.com" 2>/dev/null || true
git config user.name "Your Name" 2>/dev/null || true

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "📍 Adding GitHub remote..."
    git remote add origin https://github.com/aprelay/emailloginverify.git
fi

# Show current status
echo "📊 Current status:"
git status --short

echo ""
echo "📦 Committing all changes..."
git add -A
git commit -m "Deploy optimized email verifier with bulk submission support" || echo "No changes to commit"

echo ""
echo "🔄 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "🌐 Repository: https://github.com/aprelay/emailloginverify"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to Cloudflare Dashboard: https://dash.cloudflare.com"
    echo "2. Navigate to Pages → Create project"
    echo "3. Connect to GitHub → Select 'aprelay/emailloginverify'"
    echo "4. Configure build:"
    echo "   - Build command: npm run build"
    echo "   - Output directory: dist"
    echo "5. Deploy!"
else
    echo ""
    echo "❌ Push failed. You may need to authenticate with GitHub."
    echo ""
    echo "Options:"
    echo "1. Use GitHub CLI: gh auth login"
    echo "2. Use SSH: git remote set-url origin git@github.com:aprelay/emailloginverify.git"
    echo "3. Use Personal Access Token"
fi
