#!/bin/bash
# Kharon Deployment Script
# Purpose: Automated deployment process for Kharon website
# Dependencies: npm, git
# Structural Role: Deployment automation

set -e  # Exit on any error

echo "🚀 Starting Kharon deployment process..."

# Verify current branch
BRANCH=$(git branch --show-current)
echo "📋 Current branch: $BRANCH"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Uncommitted changes detected. Please commit or stash changes before deploying."
    exit 1
fi

echo "✅ Repository is clean"

# Run build to verify everything works
echo "🏗️  Running build process..."
npm run build

# Verify build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

echo "✅ Build completed successfully"

# Run type checking
echo "🔍 Running type checks..."
npx astro check

if [ $? -ne 0 ]; then
    echo "⚠️  Type checking revealed issues, but continuing with deployment"
fi

# Deploy to Cloudflare Pages (this would typically be handled by CI/CD)
echo "🌐 Deployment ready. Push to main branch to trigger Cloudflare Pages deployment."

echo "✅ Deployment preparation completed successfully!"
echo "📋 Next steps:"
echo "   1. Commit any pending changes"
echo "   2. Push to main branch to trigger Cloudflare Pages deployment"
echo "   3. Monitor deployment status in Cloudflare Dashboard"