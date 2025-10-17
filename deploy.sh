#!/bin/bash

echo "======================================"
echo "SEIV Project 3 - Frontend Deployment"
echo "======================================"

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production bundle
echo "🏗️  Building production bundle..."
npm run build

# Set proper permissions
echo "🔐 Setting permissions..."
sudo chmod -R 755 dist
sudo chown -R nginx:nginx dist

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "Frontend is now live at http://$(curl -s ifconfig.me)"
