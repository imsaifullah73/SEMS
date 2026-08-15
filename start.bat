@echo off
cd /d "%~dp0"
echo Starting SEMS...
echo Logging errors to start-error.log
echo.
"C:\Program Files\nodejs\node.exe" "%~dp0start.mjs" 1> "%~dp0start-output.log" 2> "%~dp0start-error.log"
echo.
echo --- OUTPUT LOG ---
type "%~dp0start-output.log" 2>nul
echo.
echo --- ERROR LOG ---
type "%~dp0start-error.log" 2>nul
echo.
echo Server stopped. Press any key to close...
pause