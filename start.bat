@echo off
echo ============================================
echo   SatoshiSignal - Starting Platform
echo ============================================
echo.

echo [1/2] Starting backend...
start "SatoshiSignal Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 8 /nobreak > nul

echo [2/2] Starting frontend...
start "SatoshiSignal Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo ============================================
echo   Both servers are running!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Dashboard: http://localhost:3000/dashboard
echo ============================================
echo.
echo Press any key to close this window (servers will keep running)...
pause > nul