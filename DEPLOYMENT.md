# MasalaCafe — DigitalOcean Deployment Guide

This guide covers deploying the MasalaCafe full-stack app (TanStack Start + Node.js backend) to a DigitalOcean App Platform or Droplet.

---

## Option 1: DigitalOcean App Platform (Recommended — Easiest)

DigitalOcean App Platform handles auto-scaling, SSL, and CI/CD from GitHub.

### Setup Steps

1. **Connect GitHub to DigitalOcean**
   - Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
   - Click "Apps" → "Create App"
   - Select "GitHub" and authorize
   - Choose your `masala-cafe` repository

2. **Configure the App**
   - **Name**: `masala-cafe`
   - **Source Branch**: `main`
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start` (or `node dist/server.js` if needed)
   - **HTTP Port**: `3000`

3. **Environment Variables**
   - Add to App Platform:
     ```
     VITE_SUPABASE_URL=https://zbbzubnuljggnoxcbqkl.supabase.co
     VITE_SUPABASE_ANON_KEY=<your-anon-key>
     NODE_ENV=production
     ```

4. **Deploy**
   - Click "Deploy" → App Platform will auto-build and deploy
   - Your app gets a `.ondigitalocean.app` domain + free SSL

5. **Auto-Deploy on Push**
   - Every push to `main` triggers a new build and deploy automatically

---

## Option 2: DigitalOcean Droplet (More Control)

For a traditional VPS setup with manual or script-based deployment.

### Prerequisites

- **DigitalOcean Droplet** running Ubuntu 22.04+ (minimum $6/mo)
- **SSH access** to your droplet

### Setup on Droplet

#### 1. SSH into your droplet

```bash
ssh root@your-droplet-ip
```

#### 2. Install Node.js and npm

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (v20 LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify
node --version
npm --version
```

#### 3. Install PM2 (Process Manager)

```bash
npm install -g pm2
```

#### 4. Clone the Repository

```bash
cd /var/www
git clone https://github.com/yourusername/masala-cafe.git
cd masala-cafe
```

#### 5. Install Dependencies & Build

```bash
npm install --production
npm run build
```

#### 6. Create `.env` file on Server

```bash
cat > .env.production << EOF
VITE_SUPABASE_URL=https://zbbzubnuljggnoxcbqkl.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
NODE_ENV=production
EOF
```

#### 7. Start the App with PM2

```bash
# Start the app
pm2 start "npm run preview" --name "masala-cafe"

# Save PM2 config to auto-restart on reboot
pm2 startup
pm2 save
```

#### 8. Setup Nginx as Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/masala-cafe << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/masala-cafe /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

#### 9. Setup SSL with Let's Encrypt (Free)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Verify auto-renewal
certbot renew --dry-run
```

#### 10. Setup Auto-Deployment (GitHub Actions + Webhook)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: root
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            cd /var/www/masala-cafe
            git pull origin main
            npm install --production
            npm run build
            pm2 restart masala-cafe
```

Then add GitHub Secrets:
- `DROPLET_IP`: Your droplet's IP
- `DROPLET_SSH_KEY`: Your SSH private key

---

## Post-Deployment Checklist

- [ ] App is running at your domain
- [ ] SSL certificate is active (green lock)
- [ ] Supabase environment variables are set
- [ ] Database migrations are applied (if any)
- [ ] Test menu loading from Supabase
- [ ] Test cart functionality
- [ ] Monitor logs: `pm2 logs masala-cafe`

---

## Troubleshooting

### App won't start

```bash
# Check PM2 logs
pm2 logs masala-cafe

# Check Nginx
nginx -t
systemctl status nginx

# Test local
npm run preview
```

### Database connection fails

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Check Supabase project is active
- Ensure network access is allowed

### SSL issues

```bash
# Renew certificate manually
certbot renew --force-renewal

# Check certificate
certbot certificates
```

---

## Performance Tips

- Use CDN for images (Cloudflare is free)
- Enable gzip compression in Nginx
- Monitor droplet CPU/RAM with DigitalOcean metrics
- Scale to larger droplet if needed

---

## Recommended: App Platform

For simplicity, **DigitalOcean App Platform** is recommended because:
- ✅ Auto-builds on every push
- ✅ Free SSL/HTTPS
- ✅ Auto-scaling
- ✅ Zero DevOps overhead
- ✅ $12/mo starting price (includes free tier resources)

Just connect your GitHub repo and deploy!
