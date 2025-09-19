#!/bin/bash
# Development startup script for EcoSwap

echo "🌱 Starting EcoSwap Development Environment"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Start backend
echo "🚀 Starting Backend API on port 3001..."
cd backend
cp .env.example .env 2>/dev/null || true
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend 
echo "🎨 Starting Frontend on port 5173..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 EcoSwap is starting up!"
echo "📊 Backend API: http://localhost:3001/api/health"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Shutting down..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
