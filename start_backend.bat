@echo off
echo ====================================================
echo Starting TradeAI Python FastAPI Backend Server...
echo ====================================================
cd backend
..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
