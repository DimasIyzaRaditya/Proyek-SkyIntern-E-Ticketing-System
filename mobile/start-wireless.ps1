param(
    [string]$DeviceId = "",
    [string]$AdbEndpoint = "",
    [int]$ReconnectRetries = 5,
    [int]$RetryDelaySeconds = 3
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SkyIntern Mobile - Wireless Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Ensure-Tool([string]$name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "[ERROR] '$name' tidak ditemukan di PATH" -ForegroundColor Red
        exit 1
    }
}

function Get-ConnectedTarget([string]$preferredDeviceId) {
    $adbLines = (& adb devices) -split "`r?`n"
    $deviceLines = $adbLines | Where-Object { $_ -match "\sdevice$" }

    if ($preferredDeviceId -ne "") {
        $exists = $deviceLines | Where-Object { $_ -match "^$([regex]::Escape($preferredDeviceId))\sdevice$" }
        if ($exists) {
            return $preferredDeviceId
        }

        return ""
    }

    # Prefer wireless entries from ADB over USB/emulator when available.
    $wireless = $deviceLines | Where-Object { $_ -match "_adb-tls-connect\._tcp|:\d+\sdevice$" }
    if ($wireless) {
        return (($wireless | Select-Object -First 1) -split "\s+")[0]
    }

    if ($deviceLines) {
        return (($deviceLines | Select-Object -First 1) -split "\s+")[0]
    }

    return ""
}

Ensure-Tool "flutter"
Ensure-Tool "adb"

# Refresh ADB transport list.
& adb start-server | Out-Null

if ($ReconnectRetries -lt 0) {
    $ReconnectRetries = 0
}

if ($RetryDelaySeconds -lt 1) {
    $RetryDelaySeconds = 1
}

$target = Get-ConnectedTarget -preferredDeviceId $DeviceId

for ($attempt = 1; $target -eq "" -and $attempt -le $ReconnectRetries; $attempt++) {
    Write-Host "[INFO] Device belum siap. Reconnect attempt $attempt/$ReconnectRetries..." -ForegroundColor Yellow

    & adb reconnect offline | Out-Null
    & adb reconnect | Out-Null

    if ($AdbEndpoint -ne "") {
        Write-Host "[INFO] Mencoba adb connect ke $AdbEndpoint" -ForegroundColor Yellow
        & adb connect $AdbEndpoint | Out-Host
    }

    Start-Sleep -Seconds $RetryDelaySeconds
    $target = Get-ConnectedTarget -preferredDeviceId $DeviceId
}

if ($target -eq "") {
    if ($DeviceId -ne "") {
        Write-Host "[ERROR] Device '$DeviceId' tidak ditemukan dengan status 'device' setelah retry." -ForegroundColor Red
    }
    else {
        Write-Host "[ERROR] Tidak ada device dengan status 'device' setelah retry." -ForegroundColor Red
    }

    Write-Host "[INFO] Jalankan pair/connect wireless dulu:" -ForegroundColor Yellow
    Write-Host "       adb pair <IP_PAIRING>:<PORT_PAIRING>" -ForegroundColor Yellow
    Write-Host "       adb connect <IP_DEVICE>:<PORT_DEBUG>" -ForegroundColor Yellow
    Write-Host ""
    & adb devices | Out-Host
    exit 1
}

Write-Host "[INFO] Target device: $target" -ForegroundColor Green
Write-Host "[INFO] Menjalankan: flutter run -d $target" -ForegroundColor Green
Write-Host ""

& flutter run -d $target
