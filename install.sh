#!/bin/bash

echo "📦 Installing Unrestricted AI Chat..."
echo ""

# Backend
echo "🐍 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed!"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

echo ""

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed!"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Get an API key from https://openrouter.ai"
echo "2. Add it to backend/.env as OPENROUTER_API_KEY=your_key"
echo "3. Run: ./run.sh (Linux/Mac) or run.bat (Windows)"
echo ""

