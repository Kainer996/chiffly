@echo off
echo 🚀 Social Hub Production Setup
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install --production

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating environment file...
    copy env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your production settings:
    echo    - Set DOMAIN_URL to your actual domain
    echo    - Set NODE_ENV to 'production'
    echo    - Configure any other required variables
    echo.
    pause
)

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing PM2 process manager...
    call npm install -g pm2
)

REM Start the application with PM2
echo 🚀 Starting application with PM2...
call pm2 start server.js --name "social-hub"

REM Save PM2 configuration
call pm2 save

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Purchase a domain name from a registrar (Namecheap, Cloudflare, etc.)
echo 2. Choose a hosting provider (DigitalOcean, Railway, Render)
echo 3. Deploy your code to the hosting provider
echo 4. Configure DNS to point your domain to your hosting provider
echo 5. Enable HTTPS/SSL certificate
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions
echo.
echo 🌐 Your app is running locally at: http://localhost:3000
echo 📊 Monitor with: pm2 status
echo 📝 View logs with: pm2 logs social-hub
echo 🔄 Restart with: pm2 restart social-hub
echo.
echo 🎉 Happy streaming!
pause 