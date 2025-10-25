#!/bin/bash

# Unrestricted Chat Backend Startup Script
echo "🤖 Starting Unrestricted AI Chat Backend..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "unrestricted_chat.py" ]; then
    echo "❌ unrestricted_chat.py not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
pip3 install fastapi uvicorn websockets sqlalchemy pydantic

# Set environment variables
export PORT=8001
export LOCAL_MODEL_URL="http://100.29.16.164:8000"
export LOCAL_MODEL_NAME="/home/ubuntu/models/Qwen2.5-14B-Instruct-AWQ"
export USE_LOCAL_MODEL="true"

echo "🚀 Starting Unrestricted Chat Server on port 8001..."
echo "🔗 Chat API will be available at: http://localhost:8001"
echo "📡 WebSocket endpoint: ws://localhost:8001/ws/chat/{session_id}/{player_id}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python3 unrestricted_chat.py
