@echo off
setlocal
cd /d "%~dp0"
echo Rebuilding the DMU Smart Welcome website and API without cached images...
docker compose build --no-cache web api
if errorlevel 1 (
  echo Build failed. Check Docker Desktop and your network connection.
  pause
  exit /b 1
)
docker compose up -d --force-recreate web api
if errorlevel 1 (
  echo Could not restart the services. Check: docker compose logs --tail=100
  pause
  exit /b 1
)
echo Done. Open http://localhost:8080 and press Ctrl+Shift+R to refresh.
echo Stored MySQL data was NOT deleted.
pause
