@echo off
echo Setting up NGROK for ZenShe Spa...

REM Configure NGROK authentication
ngrok config add-authtoken 1ke5gA6Er1QvMKOUsYxPAAK67g5_58th2gPZU1x5Mi7HXj5Ga

echo NGROK authentication configured!
echo.
echo To start NGROK tunnel, run:
echo ngrok http --domain=rightly-wise-tadpole.ngrok-free.app 5000
echo.
echo Your backend will be accessible at: https://rightly-wise-tadpole.ngrok-free.app
echo Local backend: http://localhost:5000
echo Local frontend: http://localhost:3000
echo.
pause
