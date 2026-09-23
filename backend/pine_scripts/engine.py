from typing import Dict, List, Any, Optional
from backend.pine_scripts.simulator import PineScriptSimulator
from backend.pine_scripts.presets.timesfm_neural import build_timesfm_neural_script
from backend.pine_scripts.presets.premarket_orb import build_premarket_momentum_script
from backend.pine_scripts.presets.supertrend import build_supertrend_script
from backend.pine_scripts.presets.multi_agent import build_multi_agent_fusion_script
from backend.pine_scripts.presets.scalper import build_scalper_script

class PineScriptEngine:
    """
    TradeAI TradingView Pine Script v5 Generator & Strategy Engine.
    Produces production-grade, syntactically valid Pine Script strategies & indicators
    tailored to AI predictions, TimesFM bands, and technical momentum models.
    """

    PRESETS = [
        {
            "id": "TIMESFM_NEURAL_BANDS",
            "name": "TradeAI TimesFM 3.0 Neural Momentum Strategy",
            "category": "STRATEGY",
            "description": "Dynamic multi-horizon neural upper/lower quantile volatility bands with ATR trailing stop loss & automated execution.",
            "recommended_timeframe": "15m",
            "default_params": {
                "horizon": 7,
                "atr_length": 14,
                "atr_multiplier": 2.0,
                "stop_loss_pct": 2.5,
                "take_profit_pct": 6.0,
                "enable_trailing_stop": True
            }
        },
        {
            "id": "PREMARKET_MOMENTUM",
            "name": "TradeAI 9:00 AM Pre-Market Breakout Strategy",
            "category": "STRATEGY",
            "description": "Captures 9:00 AM pre-market opening range breakouts with volume confirmation and daily target guardrails.",
            "recommended_timeframe": "5m",
            "default_params": {
                "opening_range_mins": 15,
                "volume_multiplier": 1.5,
                "stop_loss_pct": 1.5,
                "take_profit_pct": 4.5,
                "session_close_hour": 15
            }
        },
        {
            "id": "SUPER_TREND_VOLATILITY",
            "name": "TradeAI Dual SuperTrend & RSI Filter",
            "category": "STRATEGY",
            "description": "Dual SuperTrend trend confirmation combined with 200 EMA macro filter and RSI momentum gates.",
            "recommended_timeframe": "1h",
            "default_params": {
                "atr_period": 10,
                "factor_fast": 3.0,
                "factor_slow": 6.0,
                "rsi_length": 14,
                "rsi_overbought": 70,
                "rsi_oversold": 30
            }
        },
        {
            "id": "MULTI_AGENT_FUSION",
            "name": "TradeAI Multi-Agent Fusion Oscillator (Indicator)",
            "category": "INDICATOR",
            "description": "Chart indicator fusing MACD histogram momentum, RSI divergence, and Bollinger Band squeeze signals with visual buy/sell markers.",
            "recommended_timeframe": "15m",
            "default_params": {
                "macd_fast": 12,
                "macd_slow": 26,
                "macd_signal": 9,
                "bb_length": 20,
                "bb_mult": 2.0
            }
        },
        {
            "id": "AI_BREAKOUT_SCALPER",
            "name": "TradeAI Intraday AI Scalper Pro",
            "category": "STRATEGY",
            "description": "High-velocity 5m intraday scalper detecting sudden order flow surges and mean reversion bands.",
            "recommended_timeframe": "5m",
            "default_params": {
                "ema_fast": 9,
                "ema_slow": 21,
                "risk_per_trade_pct": 1.0,
                "stop_loss_pct": 1.2,
                "take_profit_pct": 2.8
            }
        }
    ]

    @classmethod
    def get_presets(cls) -> List[Dict[str, Any]]:
        return cls.PRESETS

    @classmethod
    def generate_pine_script(
        cls,
        symbol: str,
        name: Optional[str] = None,
        preset: str = "TIMESFM_NEURAL_BANDS",
        script_type: str = "STRATEGY", # "STRATEGY" or "INDICATOR"
        timeframe: str = "15m",
        initial_capital: float = 100000.0,
        stop_loss_pct: float = 2.5,
        take_profit_pct: float = 6.0,
        custom_inputs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generates full TradingView Pine Script v5 code and calculates simulated backtest stats.
        """
        sym_clean = symbol.upper().replace(".NS", "").replace("^", "").strip()
        asset_name = name or sym_clean
        inputs = custom_inputs or {}

        sl_pct = float(inputs.get("stop_loss_pct", stop_loss_pct))
        tp_pct = float(inputs.get("take_profit_pct", take_profit_pct))
        init_cap = int(inputs.get("initial_capital", initial_capital))

        if preset == "TIMESFM_NEURAL_BANDS":
            code = build_timesfm_neural_script(sym_clean, asset_name, script_type, timeframe, init_cap, sl_pct, tp_pct, inputs)
            desc = f"TradingView Pine Script v5 implementation of TradeAI TimesFM 3.0 Neural Momentum Strategy tailored for {sym_clean} ({timeframe})."
        elif preset == "PREMARKET_MOMENTUM":
            code = build_premarket_momentum_script(sym_clean, asset_name, script_type, timeframe, init_cap, sl_pct, tp_pct, inputs)
            desc = f"TradingView Pine Script v5 9:00 AM Pre-Market opening breakout strategy with volume surge detection for {sym_clean}."
        elif preset == "SUPER_TREND_VOLATILITY":
            code = build_supertrend_script(sym_clean, asset_name, script_type, timeframe, init_cap, sl_pct, tp_pct, inputs)
            desc = f"TradingView Pine Script v5 Dual SuperTrend and RSI momentum filter strategy for {sym_clean}."
        elif preset == "MULTI_AGENT_FUSION":
            code = build_multi_agent_fusion_script(sym_clean, asset_name, script_type, timeframe, inputs)
            desc = f"TradingView Pine Script v5 Multi-Agent Fusion Indicator overlay for {sym_clean}."
        else: # AI_BREAKOUT_SCALPER
            code = build_scalper_script(sym_clean, asset_name, script_type, timeframe, init_cap, sl_pct, tp_pct, inputs)
            desc = f"TradingView Pine Script v5 Intraday AI Scalper Pro strategy for {sym_clean} ({timeframe})."

        # Simulate backtest metrics
        backtest = PineScriptSimulator.simulate_backtest(preset=preset, sl_pct=sl_pct, tp_pct=tp_pct, initial_capital=init_cap)

        return {
            "symbol": sym_clean,
            "title": f"TradeAI {preset.replace('_', ' ').title()} - {sym_clean}",
            "preset": preset,
            "script_type": script_type,
            "timeframe": timeframe,
            "pine_version": "v5",
            "code": code,
            "description": desc,
            "inputs": {
                "symbol": sym_clean,
                "preset": preset,
                "timeframe": timeframe,
                "initial_capital": init_cap,
                "stop_loss_pct": sl_pct,
                "take_profit_pct": tp_pct,
                **inputs
            },
            "backtest_stats": backtest
        }

    @classmethod
    def simulate_backtest(
        cls, preset: str, sl_pct: float = 2.5, tp_pct: float = 6.0,
        initial_capital: float = 100000.0, total_bars: int = 100
    ) -> Dict[str, Any]:
        return PineScriptSimulator.simulate_backtest(
            preset=preset,
            sl_pct=sl_pct,
            tp_pct=tp_pct,
            initial_capital=initial_capital,
            total_bars=total_bars
        )
