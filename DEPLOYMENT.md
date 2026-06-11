# Deployment Guide: Making Your Social Hub Official

This guide will walk you through deploying your Social Hub streaming platform to a live domain.

## Step 1: Choose and Purchase a Domain

### Recommended Domain Names
Based on your platform, consider these domain options:
- `socialhub.live` or `socialhub.stream`
- `questingirl.com` or `questingirl.live`
- `virtualpub.live` or `virtualpub.stream`
- `cvlog.live` or `cvlog.stream`

### Best Domain Registrars
1. **Namecheap** (Recommended)
   - Competitive pricing ($10-15/year)
   - Free WHOIS privacy protection
   - Easy DNS management
   - Good customer support

2. **Cloudflare**
   - At-cost pricing (no markup)
   - Excellent DNS performance
   - Free SSL certificates
   - Advanced security features

3. **Domain.com**
   - User-friendly interface
   - Good bundling options
   - Regular promotions

### Domain Purchase Process
1. Go to your chosen registrar's website
2. Search for your desired domain name
3. Add to cart and complete purchase
4. Enable auto-renewal to prevent expiration
5. Enable WHOIS privacy protection

## Step 2: Choose a Hosting Provider

### Recommended for Your Node.js App

#### Option A: DigitalOcean (Recommended)
**Cost**: $4-12/month
**Why**: Great for Node.js, excellent performance, good documentation

**Setup Process**:
1. Create DigitalOcean account
2. Create a new Droplet (Ubuntu 22.04 LTS)
3. Choose $4/month plan (1GB RAM, 1 vCPU)
4. Add your SSH key for secure access

#### Option B: Railway
**Cost**: $5/month
**Why**: Easy deployment, Git integration, automatic scaling

**Setup Process**:
1. Create Railway account
2. Connect your GitHub repository
3. Deploy with one click
4. Set environment variables

#### Option C: Render
**Cost**: $7/month
**Why**: Simple deployment, free SSL, good for beginners

**Setup Process**:
1. Create Render account
2. Connect your GitHub repository
3. Configure build and start commands
4. Deploy automatically

## Step 3: Prepare Your Code for Deployment

### 1. Create Production Environment File
Create a `.env` file with your production settings:

```bash
NODE_ENV=production
DOMAIN_URL=yourdomain.com
PORT=3000
```

### 2. Update Package.json
Ensure your `package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### 3. Test Locally
Before deploying, test your app locally:

```bash
npm install
npm start
```

Visit `http://localhost:3000` to ensure everything works.

## Step 4: Deploy Your Application

### Option A: DigitalOcean Deployment

#### 1. Connect to Your Droplet
```bash
ssh root@your_droplet_ip
```

#### 2. Install Node.js and PM2
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install git -y
```

#### 3. Clone and Setup Your App
```bash
# Clone your repository
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Install dependencies
npm install --production

# Create environment file
nano .env
# Add your production environment variables

# Start with PM2
pm2 start server.js --name "social-hub"
pm2 startup
pm2 save
```

#### 4. Setup Nginx (Reverse Proxy)
```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/social-hub
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/social-hub /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Option B: Railway Deployment

1. Push your code to GitHub
2. Connect GitHub repo to Railway
3. Set environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `DOMAIN_URL=yourdomain.com`
4. Deploy automatically

### Option C: Render Deployment

1. Push your code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

## Step 5: Connect Your Domain

### 1. Get Your Server IP/URL
- **DigitalOcean**: Use your droplet's IP address
- **Railway**: Use the provided railway.app URL
- **Render**: Use the provided onrender.com URL

### 2. Configure DNS Records

#### For DigitalOcean (using IP address):
In your domain registrar's DNS settings, add:
- **A Record**: `@` → `your_server_ip`
- **A Record**: `www` → `your_server_ip`

#### For Railway/Render (using CNAME):
In your domain registrar's DNS settings, add:
- **CNAME Record**: `@` → `your-app.railway.app`
- **CNAME Record**: `www` → `your-app.railway.app`

### 3. Wait for DNS Propagation
DNS changes can take 24-48 hours to propagate worldwide. You can check status at:
- https://www.whatsmydns.net/

## Step 6: Enable HTTPS (SSL Certificate)

### For DigitalOcean:
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

### For Railway/Render:
SSL is automatically provided for custom domains.

## Step 7: Final Configuration

### 1. Update Your Environment Variables
```bash
NODE_ENV=production
DOMAIN_URL=yourdomain.com
PORT=3000
```

### 2. Test Your Live Site
Visit your domain and test:
- Homepage loads correctly
- All sections (Questing IRL, Virtual Pub) work
- Streaming functionality works
- Chat system functions
- Mobile responsiveness

### 3. Monitor Your Application
```bash
# Check PM2 status (DigitalOcean)
pm2 status
pm2 logs social-hub

# Monitor server resources
htop
```

## Step 8: Post-Deployment Checklist

- [ ] Domain resolves to your application
- [ ] HTTPS is working (green lock icon)
- [ ] All pages load correctly
- [ ] Streaming functionality works
- [ ] Chat system functions
- [ ] Mobile version works
- [ ] Performance is acceptable
- [ ] Error monitoring is set up

## Ongoing Maintenance

### Regular Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart social-hub
```

### Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor server resources
- Check error logs regularly
- Keep dependencies updated

### Backups
- Regular code backups via Git
- Database backups (when you add a database)
- Server snapshots (DigitalOcean)

## Troubleshooting

### Common Issues

1. **Domain not resolving**
   - Check DNS settings
   - Wait for propagation
   - Verify A/CNAME records

2. **SSL certificate issues**
   - Ensure domain points to server
   - Run certbot again
   - Check Nginx configuration

3. **Application not starting**
   - Check PM2 logs: `pm2 logs`
   - Verify environment variables
   - Check port availability

4. **WebRTC not working**
   - Ensure HTTPS is enabled
   - Check STUN/TURN server configuration
   - Verify firewall settings

### Getting Help
- Check hosting provider documentation
- Use community forums (DigitalOcean Community, Railway Discord)
- Monitor application logs for errors

---

**Congratulations!** Your Social Hub streaming platform is now live and official! 🎉

Remember to:
- Keep your domain registration current
- Monitor your application regularly
- Update dependencies for security
- Scale resources as your user base grows 