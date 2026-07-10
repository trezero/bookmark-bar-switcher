@echo off
REM Package extension for Chrome Web Store submission
REM This script builds the extension and creates a properly formatted ZIP file

echo.
echo ===================================
echo   BarSwap Extension Packager
echo ===================================
echo.

REM Get version from package.json
for /f "tokens=2 delims=:, " %%a in ('type package.json ^| findstr /C:"version"') do (
    set VERSION=%%a
)
set VERSION=%VERSION:"=%

echo Current version: %VERSION%
echo.

REM Build the extension
echo [1/3] Building extension...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build complete!
echo.

REM Create output directory
if not exist "releases" mkdir releases

REM Create ZIP file
set OUTPUT_FILE=releases\barswap-%VERSION%.zip

echo [2/3] Creating ZIP package: %OUTPUT_FILE%

REM Remove old ZIP if exists
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

REM Create ZIP using PowerShell
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath '%OUTPUT_FILE%' -CompressionLevel Optimal"

if errorlevel 1 (
    echo ERROR: Failed to create ZIP file!
    pause
    exit /b 1
)

echo ZIP package created!
echo.

REM Show file info
echo [3/3] Package details:
for %%A in ("%OUTPUT_FILE%") do (
    echo   File: %%~nxA
    echo   Size: %%~zA bytes
    echo   Location: %CD%\%%A
)
echo.

echo ===================================
echo   Packaging Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Upload %OUTPUT_FILE% to Chrome Web Store
echo 2. Or use: npm run release (if automated publishing is configured)
echo.

pause
