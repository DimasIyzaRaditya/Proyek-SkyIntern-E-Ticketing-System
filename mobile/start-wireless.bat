@echo off
setlocal

REM Simple wrapper for the PowerShell wireless runner
powershell -ExecutionPolicy Bypass -File "%~dp0start-wireless.ps1" %*

endlocal
