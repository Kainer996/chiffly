#!/bin/bash

# Social Hub Production Setup Script
# This script helps set up your Social Hub platform for production deployment

echo "🚀 Social Hub Production Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your production settings:"
    echo "   - Set DOMAIN_URL to your actual domain"
    echo "   - Set NODE_ENV to 'production'"
    echo "   - Configure any other required variables"
    echo ""
    read -p "Press Enter to continue after editing .env file..."
fi

# Check if PM2 is installed (for production process management)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 process manager..."
    npm install -g pm2
fi

# Test the application
echo "🧪 Testing application..."
npm test 2>/dev/null || echo "No tests configured"

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start server.js --name "social-hub" --watch

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Purchase a domain name from a registrar (Namecheap, Cloudflare, etc.)"
echo "2. Choose a hosting provider (DigitalOcean, Railway, Render)"
echo "3. Deploy your code to the hosting provider"
echo "4. Configure DNS to point your domain to your hosting provider"
echo "5. Enable HTTPS/SSL certificate"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🌐 Your app is running locally at: http://localhost:3000"
echo "📊 Monitor with: pm2 status"
echo "📝 View logs with: pm2 logs social-hub"
echo "🔄 Restart with: pm2 restart social-hub"
echo ""
echo "🎉 Happy streaming!" 