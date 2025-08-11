# PowerShell script to start development environment
# Run with: .\start-dev.ps1

Write-Host "🌿 Starting Mint Analytics Development Environment..." -ForegroundColor Green

# Check if virtual environment exists
if (-not (Test-Path "venv/Scripts/python.exe")) {
    Write-Host "❌ Virtual environment not found. Please run: python -m venv venv" -ForegroundColor Red
    exit 1
}

# Check if backend dependencies are installed
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Yellow
$pipList = & venv/Scripts/python.exe -m pip list
if (-not ($pipList -match "fastapi")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    & venv/Scripts/python.exe -m pip install -r backend/requirements.txt
}

# Check if frontend dependencies are installed
Write-Host "📦 Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Function to start backend
function Start-Backend {
    Write-Host "🐍 Starting FastAPI backend on http://localhost:8000..." -ForegroundColor Cyan
    $env:PARQUET_DATA_DIR = "$PWD/data"
    & venv/Scripts/python.exe -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
}

# Function to start frontend
function Start-Frontend {
    Write-Host "⚛️ Starting React frontend on http://localhost:3000..." -ForegroundColor Cyan
    Set-Location frontend
    $env:REACT_APP_API_URL = "http://localhost:8000"
    npm start
    Set-Location ..
}

# Start both services in background jobs
Write-Host "🚀 Starting services..." -ForegroundColor Green

# Start backend in background
$backendJob = Start-Job -ScriptBlock ${function:Start-Backend}
Write-Host "Backend started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Wait a moment for backend to initialize
Start-Sleep -Seconds 3

# Start frontend in background  
$frontendJob = Start-Job -ScriptBlock ${function:Start-Frontend}
Write-Host "Frontend started (Job ID: $($frontendJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Function to cleanup jobs
function Stop-Services {
    Write-Host "🛑 Stopping services..." -ForegroundColor Red
    Stop-Job -Job $backendJob, $frontendJob
    Remove-Job -Job $backendJob, $frontendJob
    Write-Host "Services stopped." -ForegroundColor Red
}

# Register cleanup function for Ctrl+C
try {
    # Keep script running and show job output
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Show any job output
        Receive-Job -Job $backendJob, $frontendJob
        
        # Check if jobs are still running
        if ($backendJob.State -eq "Failed" -or $frontendJob.State -eq "Failed") {
            Write-Host "❌ One or more services failed. Check logs above." -ForegroundColor Red
            break
        }
    }
}
catch [System.Management.Automation.PipelineStoppedException] {
    # Ctrl+C pressed
    Stop-Services
}
finally {
    Stop-Services
}