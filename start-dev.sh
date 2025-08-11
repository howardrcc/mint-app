#!/bin/bash
# Shell script to start development environment
# Run with: ./start-dev.sh

set -e

echo "🌿 Starting Mint Analytics Development Environment..."

# Check if virtual environment exists
if [ ! -f "venv/bin/python" ] && [ ! -f "venv/Scripts/python.exe" ]; then
    echo "❌ Virtual environment not found. Please run: python -m venv venv"
    exit 1
fi

# Determine Python executable path
if [ -f "venv/bin/python" ]; then
    PYTHON_EXE="venv/bin/python"
else
    PYTHON_EXE="venv/Scripts/python.exe"
fi

# Check if backend dependencies are installed
echo "📦 Checking backend dependencies..."
if ! $PYTHON_EXE -c "import fastapi" 2>/dev/null; then
    echo "Installing backend dependencies..."
    $PYTHON_EXE -m pip install -r backend/requirements.txt
fi

# Check if frontend dependencies are installed
echo "📦 Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "Services stopped."
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start backend
echo "🐍 Starting FastAPI backend on http://localhost:8000..."
export PARQUET_DATA_DIR="$(pwd)/data"
cd backend
$PYTHON_EXE -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "⚛️ Starting React frontend on http://localhost:3000..."
export REACT_APP_API_URL="http://localhost:8000"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait