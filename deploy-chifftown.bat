@echo off
echo 🏰 Chifftown.com Deployment Setup
echo ==================================

echo ✅ Domain: chifftown.com (purchased)
echo 📦 Preparing your Social Hub platform for deployment...
echo.

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

REM Create environment file for Chifftown.com
echo 📝 Creating Chifftown.com environment configuration...
echo NODE_ENV=production > .env
echo DOMAIN_URL=chifftown.com >> .env
echo PORT=3000 >> .env

echo ✅ Environment configured for chifftown.com

REM Test the application locally
echo 🧪 Testing application locally...
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop the server when ready to deploy
echo.
echo 📋 Next steps after testing:
echo 1. Choose hosting provider (Railway recommended)
echo 2. Push code to GitHub
echo 3. Deploy to hosting provider
echo 4. Configure DNS at your domain registrar
echo 5. Point chifftown.com to your hosting provider
echo.
echo 📖 See CHIFFTOWN-DEPLOYMENT.md for detailed instructions
echo.
pause

REM Start the server for testing
call npm start 