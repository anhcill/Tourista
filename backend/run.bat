@echo off
cd /d "%~dp0"
echo Starting Tourista Backend...
echo.
echo Make sure MySQL/Railway DB is accessible.
echo Press Ctrl+C to stop, or close this window.
echo.
.\mvnw.cmd spring-boot:run
pause
