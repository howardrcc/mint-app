@echo off
REM Batch script to start development environment
REM Run with: start-dev.bat

echo 🌿 Starting Mint Analytics Development Environment...

REM Check if virtual environment exists
if not exist "venv\Scripts\python.exe" (
    echo ❌ Virtual environment not found. Please run: python -m venv venv
    pause
    exit /b 1
)

REM Check if backend dependencies are installed
echo 📦 Checking backend dependencies...
venv\Scripts\python.exe -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing backend dependencies...
    venv\Scripts\python.exe -m pip install -r backend\requirements.txt
)

REM Check if frontend dependencies are installed
echo 📦 Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo 🚀 Starting services...

REM Set environment variables
set PARQUET_DATA_DIR=%CD%\data
set REACT_APP_API_URL=http://localhost:8000

REM Start backend in new window
echo 🐍 Starting FastAPI backend on http://localhost:8000...
start "Mint Backend" /D "%CD%\backend" cmd /c "cd /d %CD%\backend && %CD%\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo ⚛️ Starting React frontend on http://localhost:3000...
start "Mint Frontend" /D "%CD%\frontend" cmd /c "cd /d %CD%\frontend && npm start"

echo.
echo ✅ Development environment started!
echo 📱 Frontend: http://localhost:3000
echo 🔗 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Both services are running in separate windows.
echo Close the command windows to stop the services.
echo.
pause