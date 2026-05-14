@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    StrikePOS Desktop Launcher (Portable)
echo ==========================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js to run StrikePOS.
    pause
    exit /b
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [1/3] Installing dependencies... This may take a minute...
    call npm install --quiet
) else (
    echo [1/3] Dependencies found.
)

:: Generate Prisma Client
echo [2/3] Preparing database...
call npx prisma generate

:: Start the app and open browser
echo [3/3] Launching StrikePOS...
echo App will open at http://localhost:3001
echo.
echo Press Ctrl+C in this window to stop the server.
echo.

start http://localhost:3001
call npm run dev

pause
