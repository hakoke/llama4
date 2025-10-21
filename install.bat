@echo off
echo 📦 Installing Unrestricted AI Chat...
echo.

REM Backend
echo 🐍 Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% equ 0 (
    echo ✅ Backend dependencies installed!
) else (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo.

REM Frontend
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% equ 0 (
    echo ✅ Frontend dependencies installed!
) else (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo 🎉 Installation complete!
echo.
echo Next steps:
echo 1. Get an API key from https://openrouter.ai
echo 2. Add it to backend\.env as OPENROUTER_API_KEY=your_key
echo 3. Run: run.bat
echo.
pause

