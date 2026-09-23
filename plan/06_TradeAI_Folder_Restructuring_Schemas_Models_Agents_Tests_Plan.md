# Comprehensive Codebase Restructuring Implementation Plan

## Goal Description
Restructure and reorganize the backend directory according to domain boundaries:
1. **Sync Scripts** -> [`backend/scripts/sync/`](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/scripts/sync/)
2. **Pydantic Schemas** -> [`backend/schemas/`](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/)
3. **Database Models** -> [`backend/models/`](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/)
4. **AI & Forecasters** -> [`backend/agents/`](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/agents/)
5. **Test Scripts** -> [`backend/tests/`](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/tests/)

All transitions will maintain 100% backward compatibility with clean facade re-exports, guaranteeing that all tests, imports, routers, and scripts continue to execute seamlessly.

---

## User Review Required
> [!NOTE]
> No breaking API or database schema changes will be introduced. All models, schemas, and AI engines will be available under both their new modular paths (`backend.schemas`, `backend.models`, `backend.agents`) and legacy facades (`backend.models`, `backend.db_models`, `backend.forecast_engine`, `backend.timesfm_service`).

---

## Proposed Changes

### Component 1: Sync Scripts (`backend/scripts/sync/`)
#### [NEW] [backend/scripts/sync/sync_symbols.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/scripts/sync/sync_symbols.py)
- Move standalone symbol database sync script into `backend/scripts/sync/sync_symbols.py`.
#### [MODIFY] [backend/sync_symbols.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/sync_symbols.py)
- Provide backward-compatible CLI forwarder.

---

### Component 2: Pydantic Schemas Layer (`backend/schemas/`)
Modularize Pydantic data contract schemas by domain:
#### [NEW] [backend/schemas/auth_schemas.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/auth_schemas.py)
- `UserRegister`, `UserLogin`, `UserResponse`, `TokenResponse`, `AuditLogResponse`
#### [NEW] [backend/schemas/market_schemas.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/market_schemas.py)
- `PricePoint`, `StockSummary`, `StockDetail`, `PortfolioHolding`, `PortfolioPerformance`
#### [NEW] [backend/schemas/forecast_schemas.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/forecast_schemas.py)
- `ForecastPoint`, `MorningSignal`, `MarketDigest`, `PredictionRecordResponse`, `PredictionHistoryQuery`
#### [NEW] [backend/schemas/wishlist_schemas.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/wishlist_schemas.py)
- `WishlistItemCreate`, `WishlistItemUpdate`, `WishlistItemResponse`, `WishlistResponse`
#### [NEW] [backend/schemas/pine_script_schemas.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/pine_script_schemas.py)
- `PineScriptPreset`, `PineScriptGenerateRequest`, `PineScriptSaveRequest`, `PineScriptResponse`
#### [NEW] [backend/schemas/__init__.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/schemas/__init__.py)
- Aggregate package re-exports.

---

### Component 3: Database ORM Models Layer (`backend/models/`)
Modularize SQLAlchemy DB models by entity domain:
#### [NEW] [backend/models/user_model.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/user_model.py)
- `UserDB`, `AuditLogDB`
#### [NEW] [backend/models/symbol_model.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/symbol_model.py)
- `MarketSymbolDB`
#### [NEW] [backend/models/trade_model.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/trade_model.py)
- `TradeDataDB`
#### [NEW] [backend/models/prediction_model.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/prediction_model.py)
- `DailyPredictionDB`
#### [NEW] [backend/models/wishlist_model.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/wishlist_model.py)
- `WishlistDB`
#### [NEW] [backend/models/pine_script_model.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/pine_script_model.py)
- `PineScriptDB`
#### [NEW] [backend/models/__init__.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/models/__init__.py)
- Aggregate export of both ORM entities and Pydantic schemas.
#### [MODIFY] [backend/db_models.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/db_models.py)
- Forwarder re-exporting from `backend/models/`.

---

### Component 4: AI & Agent Modules Layer (`backend/agents/`)
Organize all forecasting and AI neural engines under `backend/agents/`:
#### [NEW] [backend/agents/timesfm_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/agents/timesfm_service.py)
- Google TimesFM 3.0 PyTorch Zero-Shot Foundation Model inference engine.
#### [NEW] [backend/agents/forecast_engine.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/agents/forecast_engine.py)
- 9:00 AM IST morning signal generator, 1D/7D quantile horizon models, and prediction DB persistence.
#### [MODIFY] [backend/forecast_engine.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/forecast_engine.py)
- Facade delegating to `backend/agents/forecast_engine.py`.
#### [MODIFY] [backend/timesfm_service.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/timesfm_service.py)
- Facade delegating to `backend/agents/timesfm_service.py`.

---

### Component 5: Tests Directory (`backend/tests/` & `tests/`)
#### [NEW] [backend/tests/test_backend.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/tests/test_backend.py)
- Main integration test suite for FastAPI endpoints, DB CRUD, and AI agents.
#### [NEW] [backend/tests/test_timesfm.py](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/backend/tests/test_timesfm.py)
- Standalone TimesFM 3.0 model testing script moved from root `test.py`.
#### [MODIFY] [run_tests.bat](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/run_tests.bat) & [run_tests.sh](file:///c:/Users/jetha/OneDrive/Desktop/AI-Dev/TradeAI/run_tests.sh)
- Update test runner commands to execute `pytest backend/tests/test_backend.py -v`.

---

## Verification Plan

### Automated Tests
1. Run pytest suite:
   ```powershell
   .venv\Scripts\pytest.exe backend/tests/test_backend.py -v
   .venv\Scripts\pytest.exe backend/test_backend.py -v
   ```
   *Expected result: 11 / 11 tests passing.*

2. Run Angular frontend verification build:
   ```powershell
   cd frontend; npm run build
   ```
   *Expected result: 0 compilation errors.*
