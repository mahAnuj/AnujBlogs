#!/bin/bash
set -euo pipefail

# AnujBlog Backend Deployment Script
echo "🚀 Starting AnujBlog Backend Deployment..."

# 1) Install/refresh dependencies (ensures ts-node & tsconfig-paths available)
echo "📦 Installing dependencies (prefer npm ci, fallback to npm install)..."
if ! npm ci; then
  echo "ℹ️  npm ci failed due to lock mismatch; running npm install to update lockfile..."
  npm install
fi

# 2) Optionally run DB migrations if DATABASE_URL is present in this shell
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "🗃️  Running Drizzle migrations..."
  npx drizzle-kit push || true
else
  echo "ℹ️  Skipping migrations (DATABASE_URL not set in current shell)."
fi

# 3) Restart PM2 app using config (fresh start to pick up code/env changes)
echo "🛑 Stopping existing PM2 process (if any)..."
pm2 stop anujblog-backend 2>/dev/null || true
pm2 delete anujblog-backend 2>/dev/null || true

echo "✅ Starting PM2 with pm2.config.cjs..."
pm2 start pm2.config.cjs --update-env

# 4) Persist PM2 process list across reboots
echo "💾 Saving PM2 configuration..."
pm2 save

# 5) Status
echo "📊 Current PM2 Status:"
pm2 status

echo "🎉 Deployment Complete!"
echo "📝 View logs: pm2 logs anujblog-backend"
echo "🌐 Test API: curl http://localhost:3000/api/posts"