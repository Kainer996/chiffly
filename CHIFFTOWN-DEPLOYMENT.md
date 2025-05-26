# Chifftown.com Deployment Guide

## 🎉 Congratulations on purchasing Chifftown.com!

This guide will help you connect your new domain to your Social Hub streaming platform.

## Step 1: Choose Your Hosting Provider

Since you have the domain, now you need hosting. Here are the best options for your budget:

### Recommended: Railway ($5/month)
**Why**: Easiest deployment, automatic HTTPS, great for beginners

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Connect your GitHub account and select your cvlog repository
5. Set environment variables:
   - `NODE_ENV=production`
   - `DOMAIN_URL=chifftown.com`
   - `PORT=3000`
6. Deploy automatically

### Alternative: DigitalOcean ($4/month)
**Why**: Best value, more control, scalable

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Create a new Droplet (Ubuntu 22.04)
3. Choose $4/month plan (1GB RAM, 1 vCPU)
4. Follow the detailed setup in DEPLOYMENT.md

## Step 2: Connect Your Domain to Hosting

### For Railway:
1. After deployment, Railway will give you a URL like: `your-app-name.railway.app`
2. Go to your domain registrar (where you bought chifftown.com)
3. Find DNS settings/DNS management
4. Add these records:
   - **CNAME Record**: `@` → `your-app-name.railway.app`
   - **CNAME Record**: `www` → `your-app-name.railway.app`

### For DigitalOcean:
1. Get your server's IP address from the DigitalOcean dashboard
2. Go to your domain registrar's DNS settings
3. Add these records:
   - **A Record**: `@` → `your_server_ip`
   - **A Record**: `www` → `your_server_ip`

## Step 3: Update Your Code for Production

### Option A: Manual Environment Setup
Create a `.env` file in your project root:
```
NODE_ENV=production
DOMAIN_URL=chifftown.com
PORT=3000
```

### Option B: Use the Configuration File (Already Created)
The `chifftown-config.js` file is already set up with your domain.

## Step 4: Test Your Setup

1. **Local Testing**:
   ```bash
   npm start
   ```
   Visit `http://localhost:3000` to ensure everything works

2. **Production Testing**:
   After DNS propagation (24-48 hours), visit:
   - `http://chifftown.com`
   - `https://chifftown.com` (after SSL is set up)

## Step 5: Enable HTTPS (SSL Certificate)

### Railway (Automatic):
- SSL is automatically provided for custom domains
- Just add your domain in Railway dashboard

### DigitalOcean (Manual):
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d chifftown.com -d www.chifftown.com
```

## Step 6: DNS Propagation Check

DNS changes can take 24-48 hours. Check status at:
- [whatsmydns.net](https://www.whatsmydns.net/)
- Enter `chifftown.com` and check if it points to your hosting

## Step 7: Final Configuration

### Update Your Platform Branding
You might want to update the site to reflect the Chifftown.com branding:

1. **Update Page Titles**: Change from "Social Hub" to "Chifftown"
2. **Update Meta Tags**: Add Chifftown-specific descriptions
3. **Custom Styling**: Add Chifftown branding/colors

## Quick Start Commands

### If using Railway:
1. Push your code to GitHub
2. Connect to Railway
3. Set environment variables
4. Add custom domain in Railway dashboard
5. Update DNS records at your registrar

### If using DigitalOcean:
1. Create droplet
2. Upload code via Git
3. Install dependencies: `npm install --production`
4. Start with PM2: `pm2 start server.js --name "chifftown"`
5. Setup Nginx and SSL

## Troubleshooting

### Domain not working?
- Check DNS propagation (can take 24-48 hours)
- Verify DNS records are correct
- Clear browser cache

### SSL issues?
- Ensure domain points to server first
- For Railway: Add domain in dashboard
- For DigitalOcean: Run certbot command

### App not starting?
- Check environment variables
- Verify all dependencies are installed
- Check server logs for errors

## Cost Summary for Chifftown.com

- **Domain**: Already purchased ✅
- **Hosting**: $4-7/month (DigitalOcean/Railway)
- **SSL**: Free (Let's Encrypt/Railway)
- **Total Monthly**: $4-7/month

## Next Steps

1. **Choose hosting provider** (Railway recommended for beginners)
2. **Deploy your code** to the hosting provider
3. **Configure DNS** to point chifftown.com to your hosting
4. **Wait for DNS propagation** (24-48 hours)
5. **Test your live site** at chifftown.com
6. **Enable HTTPS** for security

## Support

If you need help with any step:
1. Check the main DEPLOYMENT.md for detailed instructions
2. Contact your hosting provider's support
3. Check DNS propagation status online

---

**Your Chifftown.com Social Hub will be live soon!** 🚀

The platform includes:
- Multi-section streaming (Questing IRL & Virtual Pub)
- Live video streaming with WebRTC
- Real-time chat system
- Room management
- Mobile-responsive design

Perfect for building your streaming community at chifftown.com! 