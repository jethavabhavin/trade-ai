import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Response
from sqlalchemy.orm import Session

try:
    from backend.models import (
        PineScriptGenerateRequest, PineScriptResponse, PineScriptSaveRequest, PineScriptUpdateRequest
    )
    from backend.db_models import UserDB, PineScriptDB
    from backend.database import get_db
    from backend.auth_utils import get_current_user, log_audit_event
    from backend.pine_script_engine import PineScriptEngine
except ImportError:
    from models import (
        PineScriptGenerateRequest, PineScriptResponse, PineScriptSaveRequest, PineScriptUpdateRequest
    )
    from db_models import UserDB, PineScriptDB
    from database import get_db
    from auth_utils import get_current_user, log_audit_event
    from pine_script_engine import PineScriptEngine

logger = logging.getLogger("PineScriptRouter")
router = APIRouter(prefix="/api/pinescript", tags=["PineScript"])

@router.get("/presets")
def get_strategy_presets():
    """
    Returns available TradingView Pine Script strategy & indicator presets.
    """
    return PineScriptEngine.get_presets()

@router.post("/generate", response_model=PineScriptResponse)
def generate_pine_script(
    req: PineScriptGenerateRequest,
    current_user: UserDB = Depends(get_current_user)
):
    """
    Generates tailored TradingView Pine Script v5 code and calculates simulated quantitative backtest metrics.
    """
    preset = req.strategy_preset or req.preset or "TIMESFM_NEURAL_BANDS"
    custom_inputs = req.inputs if req.inputs is not None else req.custom_inputs
    result = PineScriptEngine.generate_pine_script(
        symbol=req.symbol,
        name=req.name,
        preset=preset,
        script_type=req.script_type or "STRATEGY",
        timeframe=req.timeframe or "15m",
        initial_capital=req.initial_capital or 100000.0,
        stop_loss_pct=req.stop_loss_pct or 2.5,
        take_profit_pct=req.take_profit_pct or 6.0,
        custom_inputs=custom_inputs
    )

    return PineScriptResponse(
        title=result["title"],
        symbol=result["symbol"],
        script_type=result["script_type"],
        strategy_preset=result["preset"],
        timeframe=result["timeframe"],
        pine_version=result["pine_version"],
        code=result["code"],
        description=result["description"],
        inputs=result["inputs"],
        backtest_stats=result["backtest_stats"],
        created_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )

@router.post("/save", response_model=PineScriptResponse)
def save_pine_script(
    req: PineScriptSaveRequest,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Persists a generated or edited TradingView Pine Script to the user's database library.
    """
    sym_upper = req.symbol.upper().strip()
    script_id = f"ps_{current_user.id}_{int(datetime.utcnow().timestamp())}"

    new_script = PineScriptDB(
        id=script_id,
        user_id=current_user.id,
        title=req.title,
        symbol=sym_upper,
        script_type=req.script_type or "STRATEGY",
        strategy_preset=req.strategy_preset or "TIMESFM_NEURAL_BANDS",
        timeframe=req.timeframe or "15m",
        pine_version=req.pine_version or "v5",
        code=req.code,
        description=req.description or f"TradeAI Pine Script for {sym_upper}",
        inputs_json=json.dumps(req.inputs or {}),
        backtest_stats_json=json.dumps(req.backtest_stats or {}),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db_session.add(new_script)
    db_session.commit()

    log_audit_event(
        db=db_session,
        action="PINESCRIPT_SAVE",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Saved Pine Script '{req.title}' for {sym_upper}"
    )

    return PineScriptResponse(**new_script.to_dict())

@router.get("", response_model=List[PineScriptResponse])
def list_user_pine_scripts(
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Retrieves all saved Pine Scripts for the authenticated user from the database.
    """
    rows = db_session.query(PineScriptDB).filter(
        PineScriptDB.user_id == current_user.id
    ).order_by(PineScriptDB.created_at.desc()).all()

    return [PineScriptResponse(**r.to_dict()) for r in rows]

@router.get("/{script_id}", response_model=PineScriptResponse)
def get_pine_script_by_id(
    script_id: str,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Retrieves a single Pine Script by ID.
    """
    row = db_session.query(PineScriptDB).filter(
        PineScriptDB.id == script_id,
        PineScriptDB.user_id == current_user.id
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pine script with ID '{script_id}' not found."
        )

    return PineScriptResponse(**row.to_dict())

@router.put("/{script_id}", response_model=PineScriptResponse)
def update_pine_script(
    script_id: str,
    req: PineScriptUpdateRequest,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Updates an existing Pine Script in the user's database library.
    """
    row = db_session.query(PineScriptDB).filter(
        PineScriptDB.id == script_id,
        PineScriptDB.user_id == current_user.id
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pine script with ID '{script_id}' not found."
        )

    if req.title is not None:
        row.title = req.title
    if req.code is not None:
        row.code = req.code
    if req.description is not None:
        row.description = req.description
    if req.timeframe is not None:
        row.timeframe = req.timeframe
    if req.pine_version is not None:
        row.pine_version = req.pine_version
    if req.inputs is not None:
        row.inputs_json = json.dumps(req.inputs)
    if req.backtest_stats is not None:
        row.backtest_stats_json = json.dumps(req.backtest_stats)
    row.updated_at = datetime.utcnow()

    db_session.commit()

    return PineScriptResponse(**row.to_dict())

@router.delete("/{script_id}")
def delete_pine_script(
    script_id: str,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Deletes a Pine Script from the user's database library.
    """
    row = db_session.query(PineScriptDB).filter(
        PineScriptDB.id == script_id,
        PineScriptDB.user_id == current_user.id
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pine script with ID '{script_id}' not found."
        )

    db_session.delete(row)
    db_session.commit()

    log_audit_event(
        db=db_session,
        action="PINESCRIPT_DELETE",
        user_id=current_user.id,
        username=current_user.username,
        details=f"Deleted Pine Script '{row.title}' ({script_id})"
    )

    return {"status": "deleted", "id": script_id, "message": f"Pine script '{script_id}' deleted successfully"}

@router.get("/download/{script_id}")
def download_pine_script_file(
    script_id: str,
    current_user: UserDB = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """
    Exports and downloads the Pine Script as a '.pine' file ready to import into TradingView Pine Editor.
    """
    row = db_session.query(PineScriptDB).filter(
        PineScriptDB.id == script_id,
        PineScriptDB.user_id == current_user.id
    ).first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pine script with ID '{script_id}' not found."
        )

    filename = f"{row.symbol.lower()}_{row.strategy_preset.lower()}.pine"
    return Response(
        content=row.code,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
