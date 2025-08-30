@echo off
echo =======================================
echo    ZenShe Spa - Backend + NGROK
echo =======================================
echo.

echo Starting backend server on port 5000...
start "Backend Server" cmd /k "cd /d c:\Users\yassi\Desktop\dekstop\zenshe_spa\backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting NGROK tunnel...
start "NGROK Tunnel" cmd /k "ngrok http --domain=rightly-wise-tadpole.ngrok-free.app 5000"

echo.
echo =======================================
echo Backend + NGROK Setup Complete!
echo =======================================
echo Backend (Local):  http://localhost:5000
echo Backend (NGROK):  https://rightly-wise-tadpole.ngrok-free.app
echo API Test:         https://rightly-wise-tadpole.ngrok-free.app/api/test
echo.
echo Frontend will be deployed on Netlify
echo Make sure frontend .env points to: 
echo VITE_API_URL=https://rightly-wise-tadpole.ngrok-free.app
echo.
echo =======================================
pause
