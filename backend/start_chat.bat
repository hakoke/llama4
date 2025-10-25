@echo off
REM Unrestricted Chat Backend Startup Script for Windows
echo 🤖 Starting Unrestricted AI Chat Backend...

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "unrestricted_chat.py" (
    echo ❌ unrestricted_chat.py not found. Please run this script from the backend directory.
    pause
    exit /b 1
)

REM Install dependencies if needed
echo 📦 Checking dependencies...
pip install fastapi uvicorn websockets sqlalchemy pydantic

REM Set environment variables
set PORT=8001
set LOCAL_MODEL_URL=http://100.29.16.164:8000
set LOCAL_MODEL_NAME=/home/ubuntu/models/Qwen2.5-14B-Instruct-AWQ
set USE_LOCAL_MODEL=true

echo 🚀 Starting Unrestricted Chat Server on port 8001...
echo 🔗 Chat API will be available at: http://localhost:8001
echo 📡 WebSocket endpoint: ws://localhost:8001/ws/chat/{session_id}/{player_id}
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python unrestricted_chat.py
