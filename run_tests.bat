@echo off
echo =========================================================
echo       TradeAI Full Stack Automated Test Runner
echo =========================================================
echo.

echo [1/2] Running Backend Pytest Suite (Auth, RBAC, Forecast, Multi-Agent)...
call .venv\Scripts\python.exe -m pytest backend\tests\test_backend.py -v
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Running Frontend Angular Verification Build...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed!
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo =========================================================
echo   ALL TESTS PASSED SUCCESSFULLY! (100%% VERIFIED)
echo =========================================================
