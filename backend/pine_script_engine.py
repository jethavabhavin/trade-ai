from typing import Dict, List, Any, Optional

try:
    from backend.pine_scripts.engine import PineScriptEngine as ModularPineScriptEngine
except ImportError:
    from pine_scripts.engine import PineScriptEngine as ModularPineScriptEngine

class PineScriptEngine:
    """
    Facade maintaining 100% backward compatibility for PineScriptEngine.
    Delegates to modular presets and simulator under backend/pine_scripts/.
    """
    PRESETS = ModularPineScriptEngine.PRESETS

    @classmethod
    def get_presets(cls) -> List[Dict[str, Any]]:
        return ModularPineScriptEngine.get_presets()

    @classmethod
    def generate_pine_script(
        cls,
        symbol: str,
        name: Optional[str] = None,
        preset: str = "TIMESFM_NEURAL_BANDS",
        script_type: str = "STRATEGY",
        timeframe: str = "15m",
        initial_capital: float = 100000.0,
        stop_loss_pct: float = 2.5,
        take_profit_pct: float = 6.0,
        custom_inputs: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return ModularPineScriptEngine.generate_pine_script(
            symbol=symbol,
            name=name,
            preset=preset,
            script_type=script_type,
            timeframe=timeframe,
            initial_capital=initial_capital,
            stop_loss_pct=stop_loss_pct,
            take_profit_pct=take_profit_pct,
            custom_inputs=custom_inputs
        )

    @classmethod
    def simulate_backtest(
        cls,
        preset: str,
        sl_pct: float = 2.5,
        tp_pct: float = 6.0,
        initial_capital: float = 100000.0,
        total_bars: int = 100
    ) -> Dict[str, Any]:
        return ModularPineScriptEngine.simulate_backtest(
            preset=preset,
            sl_pct=sl_pct,
            tp_pct=tp_pct,
            initial_capital=initial_capital,
            total_bars=total_bars
        )
