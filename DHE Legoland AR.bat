@echo off
setlocal EnableExtensions

title DHE Legoland AR - Playwright Tests

cd /d "%~dp0"

echo ============================================================
echo   DHE Legoland AR - Running All Playwright Tests
echo ============================================================
echo   Project : %cd%
echo   Locale  : Arabic (CPC_LL_AR)
echo   Browser : Google Chrome (headed, single worker)
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo         Install Node.js and restart this batch file.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist "node_modules\@playwright\test" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

if not exist "output" mkdir output
if not exist "reports" mkdir reports

if not exist "Legoland Dropdown Values AR.xlsx" (
  echo Building Arabic dropdown reference Excel from live page...
  call node scripts\build-ar-dropdown-excel.mjs
  if errorlevel 1 (
    echo [ERROR] Failed to build Legoland Dropdown Values AR.xlsx
    pause
    exit /b 1
  )
)

set REPORT_SUITE_NAME=DHE Legoland AR
node scripts\prepare-report-run.mjs
if errorlevel 1 (
  echo [ERROR] Failed to prepare report folder.
  pause
  exit /b 1
)
call output\set-report-env.bat

echo.
echo Report run   : %REPORT_RUN_LABEL%
echo Report folder: %REPORT_RUN_FOLDER%
echo.

echo Ensuring Playwright browsers are installed...
call npx playwright install chromium
if errorlevel 1 (
  echo [ERROR] Playwright browser install failed.
  pause
  exit /b 1
)

echo Starting tests...
echo.

set CPC_SITE=LEGOLAND
set LEGOLAND_LOCALE=AR
set SEQUENTIAL_VALIDATION_PAUSE_MS=4000
call npx playwright test tests/my-profile-e2e.spec.ts --headed >nul 2>&1
set TEST_EXIT=%ERRORLEVEL%

echo.
node scripts\print-test-summary.mjs
set SUMMARY_EXIT=%ERRORLEVEL%

if %TEST_EXIT% neq 0 set FINAL_EXIT=%TEST_EXIT%
if %SUMMARY_EXIT% neq 0 set FINAL_EXIT=%SUMMARY_EXIT%
if not defined FINAL_EXIT set FINAL_EXIT=0

echo.

if exist "%PLAYWRIGHT_HTML_REPORT_DIR%\index.html" (
  echo HTML report      : %PLAYWRIGHT_HTML_REPORT_DIR%\index.html
  echo Terminal summary : %REPORT_RUN_FOLDER%\terminal-summary.txt
  echo.
)

pause
exit /b %FINAL_EXIT%
