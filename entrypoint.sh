#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Fullstack Application..."

# run prisma migrations
echo "🔄 Running Database Migrations..."
cd /app/backend
npx prisma migrate deploy

# Start the Backend in the background
echo "📦 Starting Backend Service..."
cd /app/backend
node dist/src/main.js &

# Start the Frontend in the background
echo "🖼️ Starting Frontend Service..."
cd /app/frontend
node server.js &

# Start Nginx in the foreground
echo "🌐 Starting Nginx Proxy..."
nginx -g 'daemon off;'
