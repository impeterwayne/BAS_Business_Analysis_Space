@echo off
setlocal
echo.
echo ========================================================
echo   REA_Kit Installation ^& Global Environment Setup
echo ========================================================
echo.

python "%~dp0rea.py" install %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [-] Installation encountered an error. Please ensure Python is installed and added to PATH.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo [+] REA_Kit installed successfully!
echo [+] You can now run 'rea' from any directory or terminal.
echo ========================================================
echo.
pause
