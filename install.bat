@echo off
echo Installing StreamHaven Desktop App...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not available. Please install Node.js with npm.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo Installation failed. Trying with different package manager...
    echo Checking for bun...
    
    bun --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Using bun package manager...
        call bun install
    ) else (
        echo.
        echo Installing with yarn...
        call npm install -g yarn >nul 2>&1
        call yarn install
    )
)

echo.
echo Building the application...
call npm run build

if %errorlevel% neq 0 (
    echo Build failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo Installation completed successfully!
echo.
echo To start the app:
echo   - Development mode: npm run dev
echo   - Desktop app: npm run electron
echo.
pause