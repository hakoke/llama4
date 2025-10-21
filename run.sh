#!/bin/bash

echo "🔥 Starting Unrestricted AI Chat..."
echo ""

# Check if backend/.env exists
if [ ! -f backend/.env ]; then
    echo "⚠️  No .env file found! Creating one..."
    cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:SWbLbxZPRetXsjLYQjNaqIeaFVmPhFFU@hopper.proxy.rlwy.net:47182/railway
OPENROUTER_API_KEY=your_key_here
SECRET_KEY=change-this-secret-key
EOF
    echo "✅ Created backend/.env - Please add your OPENROUTER_API_KEY!"
    echo ""
fi

# Start backend
echo "🚀 Starting backend..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 3

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

