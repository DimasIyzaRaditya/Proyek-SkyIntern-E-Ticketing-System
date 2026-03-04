$ErrorActionPreference = "SilentlyContinue"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

$port = 3001
$pids = @()

try {
  $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop |
    Select-Object -ExpandProperty OwningProcess -Unique
} catch {
  $lines = netstat -ano -p tcp | Select-String ":$port"
  foreach ($line in $lines) {
    if ($line.ToString() -notmatch "LISTENING") {
      continue
    }

    $parts = ($line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts.Length -gt 4) {
      $pid = $parts[-1]
      if ($pid -match "^\d+$" -and $pid -ne "0") {
        $pids += [int]$pid
      }
    }
  }
}

$pids = $pids | Sort-Object -Unique
foreach ($pid in $pids) {
  taskkill /PID $pid /F | Out-Null
}

Start-Sleep -Milliseconds 800

if (Test-Path ".next\dev\lock") {
  Remove-Item ".next\dev\lock" -Force
}

$isPortBusy = {
  param([int]$targetPort)

  try {
    $listeners = Get-NetTCPConnection -LocalPort $targetPort -State Listen -ErrorAction Stop
    return ($listeners | Measure-Object).Count -gt 0
  } catch {
    $line = netstat -ano -p tcp | Select-String ":$targetPort" | Select-String "LISTENING" | Select-Object -First 1
    return $null -ne $line
  }
}

$selectedPort = $port
while (& $isPortBusy $selectedPort) {
  $selectedPort++
}

if ($selectedPort -ne $port) {
  Write-Host "Port $port masih dipakai, menjalankan web di port $selectedPort" -ForegroundColor Yellow
}

npx next dev --webpack -p $selectedPort
