@echo off
title Flutter Mobile App - SkyIntern E-Ticketing
echo ========================================
echo   SkyIntern E-Ticketing Mobile App
echo ========================================
echo.

:: Check if Flutter is installed
flutter --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Flutter tidak terinstall atau tidak ada di PATH
    echo Silakan install Flutter terlebih dahulu
    pause
    exit /b 1
)

echo [INFO] Flutter terdeteksi ✓
echo [INFO] Starting mobile app pada port 8080...
echo.

:: Kill existing process on port 8080 (optional)
echo [INFO] Memeriksa port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo [WARNING] Process ditemukan di port 8080, mencoba kill...
    taskkill /PID %%a /F >nul 2>&1
)

echo [INFO] Menjalankan Flutter app...
echo [INFO] URL: http://localhost:8080
echo [INFO] Tekan Ctrl+C untuk stop server
echo.

flutter run --web-port 8080 -d web-server

echo.
echo [INFO] Flutter app stopped
pause