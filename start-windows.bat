@echo off
cd /d "%~dp0"
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker is required. Install and start Docker Desktop first.
  pause
  exit /b 1
)
docker compose up --build -d
if errorlevel 1 (
  echo Docker did not start successfully. Please check Docker Desktop.
  pause
  exit /b 1
)
echo.
echo Open http://localhost:8080 in your browser.
echo Demo student: mithil@welcome.test / Student123!
echo Demo admin: admin@welcome.test / Admin123!
pause
