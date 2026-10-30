# ==============================================================================
# BHUKKAD VERSE - Full-Stack Unified Development Orchestrator
# Launches both Django 5 REST Backend and Next.js 16 Frontend with a single command.
# ==============================================================================

$Host.UI.RawUI.WindowTitle = "Bhukkad Verse - Development Server"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  BHUKKAD VERSE - YOUR CRAVINGS. YOUR UNIVERSE." -ForegroundColor Yellow
Write-Host "  Unified Full-Stack Development Orchestrator" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host ""

$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $ROOT_DIR "backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"
$VENV_DIR = Join-Path $BACKEND_DIR "venv"
$VENV_PYTHON = Join-Path $VENV_DIR "Scripts\python.exe"

# ------------------------------------------------------------------------------
# 1. PREREQUISITE CHECKS
# ------------------------------------------------------------------------------
Write-Host "[1/6] Checking runtime prerequisites..." -ForegroundColor Cyan

# Check Python
$pythonCmd = $null
if (Test-Path $VENV_PYTHON) {
    $pythonCmd = $VENV_PYTHON
} elseif (Get-Command "py" -ErrorAction SilentlyContinue) {
    $pythonCmd = "py -3.10"
} elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} else {
    Write-Host "[ERROR] Python 3.10+ was not found on your PATH." -ForegroundColor Red
    Write-Host "        Please install Python from https://www.python.org/downloads/ and try again." -ForegroundColor Yellow
    Exit 1
}

# Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js was not found on your PATH." -ForegroundColor Red
    Write-Host "        Please install Node.js 20+ from https://nodejs.org/ and try again." -ForegroundColor Yellow
    Exit 1
}

# Check npm
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] npm was not found on your PATH." -ForegroundColor Red
    Exit 1
}

Write-Host "  [OK] Runtime environments verified." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. BACKEND ENVIRONMENT SETUP
# ------------------------------------------------------------------------------
Write-Host "[2/6] Configuring Python virtual environment..." -ForegroundColor Cyan

if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "  Creating new virtual environment at backend/venv..." -ForegroundColor Yellow
    & py -3.10 -m venv $VENV_DIR
    if (-not (Test-Path $VENV_PYTHON)) {
        & python -m venv $VENV_DIR
    }
}

if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "[ERROR] Failed to create virtual environment." -ForegroundColor Red
    Exit 1
}

# Install / update backend dependencies
$reqFile = Join-Path $BACKEND_DIR "requirements.txt"
$djangoCheck = & $VENV_PYTHON -c "import django; print(django.__version__)" 2>$null
if (-not $djangoCheck) {
    Write-Host "  Installing Python dependencies from requirements.txt..." -ForegroundColor Yellow
    & $VENV_PYTHON -m pip install -r $reqFile
}

# Ensure Pillow has valid binary extensions
$pillowCheck = & $VENV_PYTHON -c "from PIL import Image; print(Image.__name__)" 2>$null
if (-not $pillowCheck) {
    Write-Host "  Configuring Pillow binary wheel for Windows..." -ForegroundColor Yellow
    & $VENV_PYTHON -m pip install --force-reinstall --no-cache-dir Pillow
}

Write-Host "  [OK] Backend dependencies ready." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. DATABASE MIGRATIONS & SEED DATA
# ------------------------------------------------------------------------------
Write-Host "[3/6] Checking database and initial seed data..." -ForegroundColor Cyan

$dbFile = Join-Path $BACKEND_DIR "db.sqlite3"
$isFreshDb = -not (Test-Path $dbFile)

Write-Host "  Running database migrations..." -ForegroundColor Gray
& $VENV_PYTHON (Join-Path $BACKEND_DIR "manage.py") migrate --noinput

if ($isFreshDb) {
    Write-Host "  Populating master seed data (Admin, Vendors, Customers, Menus)..." -ForegroundColor Yellow
    & $VENV_PYTHON (Join-Path $BACKEND_DIR "seed_initial_data.py")
    & $VENV_PYTHON (Join-Path $BACKEND_DIR "seed_phase4_menu.py")
}

Write-Host "  [OK] Database is up to date and seeded." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 4. FRONTEND DEPENDENCIES
# ------------------------------------------------------------------------------
Write-Host "[4/6] Checking Next.js frontend dependencies..." -ForegroundColor Cyan

$nodeModulesDir = Join-Path $FRONTEND_DIR "node_modules"
if (-not (Test-Path $nodeModulesDir)) {
    Write-Host "  Installing frontend npm packages..." -ForegroundColor Yellow
    Push-Location $FRONTEND_DIR
    npm install
    Pop-Location
}
Write-Host "  [OK] Frontend packages verified." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5. START SERVERS IN SUPERVISED PROCESSES
# ------------------------------------------------------------------------------
Write-Host "[5/6] Launching full-stack servers..." -ForegroundColor Cyan

# Start Backend Server in background job
$backendScript = @"
Set-Location '$BACKEND_DIR'
& '$VENV_PYTHON' manage.py runserver 0.0.0.0:8000
"@
$backendJob = Start-Job -ScriptBlock ([scriptblock]::Create($backendScript)) -Name "BhukkadBackend"

# Start Frontend Server in background job
$frontendScript = @"
Set-Location '$FRONTEND_DIR'
npm run dev
"@
$frontendJob = Start-Job -ScriptBlock ([scriptblock]::Create($frontendScript)) -Name "BhukkadFrontend"

Write-Host "  Backend API started at:   " -NoNewline
Write-Host "http://localhost:8000/api/" -ForegroundColor Green
Write-Host "  Frontend Web started at:  " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host "  Admin CMS Portal at:      " -NoNewline
Write-Host "http://localhost:3000/admin" -ForegroundColor Green
Write-Host "  Vendor Dashboard at:      " -NoNewline
Write-Host "http://localhost:3000/vendor/dashboard" -ForegroundColor Green

# ------------------------------------------------------------------------------
# 6. OPEN DEFAULT BROWSER & SUPERVISE
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/6] Launching browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host "  BHUKKAD VERSE is LIVE! Press [Ctrl + C] to stop all servers." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "Default Test Logins:" -ForegroundColor Gray
Write-Host "  Super Admin: admin@bhukkadverse.local / admin123" -ForegroundColor White
Write-Host "  Vendor:      vendor@bhukkadverse.local / vendor123" -ForegroundColor White
Write-Host "  Customer:    customer@bhukkadverse.local / customer123" -ForegroundColor White
Write-Host ""

try {
    while ($true) {
        if ($backendJob.State -ne "Running") {
            Write-Host "[WARNING] Backend server stopped unexpectedly!" -ForegroundColor Red
            Receive-Job $backendJob
            break
        }
        if ($frontendJob.State -ne "Running") {
            Write-Host "[WARNING] Frontend server stopped unexpectedly!" -ForegroundColor Red
            Receive-Job $frontendJob
            break
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Shutting down development servers..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $backendJob -ErrorAction SilentlyContinue | Out-Null
    Stop-Job $frontendJob -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $frontendJob -ErrorAction SilentlyContinue | Out-Null

    Get-Process -Name "python", "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*Bhukkad-Verse*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] All services stopped safely." -ForegroundColor Green
}
