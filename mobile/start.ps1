# Flutter Mobile App Starter Script
# SkyIntern E-Ticketing System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SkyIntern E-Ticketing Mobile App" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Flutter installation
try {
    flutter --version | Out-Null
    Write-Host "[INFO] Flutter terdeteksi OK" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Flutter tidak terinstall atau tidak ada di PATH" -ForegroundColor Red
    Write-Host "Silakan install Flutter terlebih dahulu" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

# Check and kill existing process on port 8080
Write-Host "[INFO] Memeriksa port 8080..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "[WARNING] Process ditemukan di port 8080, mencoba kill..." -ForegroundColor Yellow
    $processes | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Start-Sleep -Seconds 2
}

Write-Host "[INFO] Menjalankan Flutter app..." -ForegroundColor Green
Write-Host "[INFO] URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "[INFO] Tekan Ctrl+C untuk stop server" -ForegroundColor Yellow
Write-Host ""

# Run Flutter app
try {
    flutter run --web-port 8080 -d web-server
} catch {
    Write-Host "[ERROR] Gagal menjalankan Flutter app" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "[INFO] Flutter app stopped" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
}