@echo off
echo =======================================
echo    ZenShe Spa - Local Development
echo =======================================
echo.

echo Starting backend server on port 5000...
start "Backend Server" cmd /k "cd /d c:\Users\yassi\Desktop\dekstop\zenshe_spa\backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server on port 3000...
start "Frontend Server" cmd /k "cd /d c:\Users\yassi\Desktop\dekstop\zenshe_spa\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo =======================================
echo Servers are starting up...
echo =======================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo API Test: http://localhost:5000/api/test
echo.
echo To expose backend via NGROK:
echo ngrok http --domain=rightly-wise-tadpole.ngrok-free.app 5000
echo.
echo Then update frontend .env to use NGROK URL if needed.
echo =======================================
pause
