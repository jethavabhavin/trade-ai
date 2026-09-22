#!/usr/bin/env bash
set -e

echo "========================================================="
echo "       TradeAI Full Stack Automated Test Runner"
echo "========================================================="
echo ""

echo "[1/2] Running Backend Pytest Suite (Auth, RBAC, Forecast, Multi-Agent)..."
if [ -d ".venv" ]; then
    source .venv/bin/activate || source .venv/Scripts/activate
fi

python -m pytest backend/test_backend.py -v

echo ""
echo "[2/2] Running Frontend Angular Verification Build..."
cd frontend
npm run build
cd ..

echo ""
echo "========================================================="
echo "   ALL TESTS PASSED SUCCESSFULLY! (100% VERIFIED)"
echo "========================================================="
