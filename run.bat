@echo off
echo 🔥 Starting Unrestricted AI Chat...
echo.

REM Check if .env exists
if not exist backend\.env (
    echo ⚠️  No .env file found! Creating one...
    (
        echo DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
        echo OPENROUTER_API_KEY=your_key_here
        echo SECRET_KEY=change-this-secret-key
    ) > backend\.env
    echo ✅ Created backend\.env - Please add your OPENROUTER_API_KEY!
    echo.
)

echo 🚀 Starting backend...
start "Backend" cmd /k "cd backend && python main.py"

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 🎨 Starting frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers started!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo.
echo Close the terminal windows to stop the servers.
pause

