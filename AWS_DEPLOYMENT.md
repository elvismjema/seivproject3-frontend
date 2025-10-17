# AWS Deployment Guide - SEIV Project 3 Frontend

## Team 2 Deployment Instructions

### Prerequisites on AWS EC2 Instance
Same as backend (Node.js, Nginx already installed)

### Step 1: Clone Repository on AWS
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone the frontend repository
cd /home/ec2-user
git clone https://github.com/elvismjema/seivproject3-frontend.git
cd seivproject3-frontend
```

### Step 2: Create Production Environment File
```bash
# Create .env file for production
cat > .env << 'EOF'
VITE_APP_BASE_URL=http://your-ec2-ip:3100/seivproject3
# OR if using domain with Nginx
VITE_APP_BASE_URL=https://api.your-domain.com/seivproject3

VITE_GOOGLE_CLIENT_ID=your-google-client-id-from-secrets
EOF
```

### Step 3: Install Dependencies and Build
```bash
npm install
npm run build
```

### Step 4: Configure Nginx to Serve Frontend
```bash
# Create Nginx configuration for frontend
sudo nano /etc/nginx/conf.d/seivproject3-frontend.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 public IP
    root /home/ec2-user/seivproject3-frontend/dist;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /seivproject3/ {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Set Proper Permissions
```bash
# Ensure Nginx can read the files
sudo chmod -R 755 /home/ec2-user/seivproject3-frontend/dist
sudo chown -R nginx:nginx /home/ec2-user/seivproject3-frontend/dist
```

### Alternative: Serve with PM2 and serve package
If you prefer to serve with Node:

```bash
# Install serve globally
sudo npm install -g serve

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'seivproject3-frontend',
    script: 'serve',
    args: 'dist -s -l 8080',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

Then update Nginx to proxy to port 8080:
```nginx
location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Quick Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash
echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Building production bundle..."
npm run build

echo "Setting permissions..."
sudo chmod -R 755 dist
sudo chown -R nginx:nginx dist

echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
```

Run deployment:
```bash
./deploy.sh
```

### Verify Deployment
```bash
# Check if files are built
ls -la dist/

# Test from server
curl http://localhost

# Test from outside
# Open browser to http://your-ec2-ip
```

### Update Google OAuth Redirect URIs
In Google Cloud Console, add:
- `http://your-ec2-ip/oauth/callback`
- `https://your-domain.com/oauth/callback`

### Environment Variables Summary

**`.env` file should contain:**
```
VITE_APP_BASE_URL=http://your-backend-url:3100/seivproject3
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Troubleshooting

#### Frontend not loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if dist folder exists
ls -la /home/ec2-user/seivproject3-frontend/dist
```

#### API calls failing
```bash
# Check if backend is running
curl http://localhost:3100

# Check browser console for CORS errors
# Verify VITE_APP_BASE_URL in .env matches backend URL
```

#### Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### SSL Certificate Setup
```bash
# Get SSL certificate (if using domain)
sudo certbot --nginx -d your-domain.com

# Certificate will auto-renew
# Test renewal
sudo certbot renew --dry-run
```

### Production Checklist

- [ ] Build completed successfully
- [ ] .env file configured with production URLs
- [ ] Nginx configured and reloaded
- [ ] Files have proper permissions
- [ ] Can access frontend from browser
- [ ] API calls to backend work
- [ ] Google OAuth redirect URIs updated
- [ ] SSL certificate installed (if using domain)
- [ ] Security group allows HTTP/HTTPS traffic
