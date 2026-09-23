from typing import Dict, Any

def build_scalper_script(
    symbol: str, name: str, script_type: str, timeframe: str,
    capital: int, sl_pct: float, tp_pct: float, inputs: Dict[str, Any]
) -> str:
    is_strat = (script_type.upper() == "STRATEGY")
    return f"""//@version=5
{f'strategy("TradeAI Scalper Pro - {symbol}", shorttitle="TradeAI-Scalper", overlay=true, initial_capital={capital}, default_qty_type=strategy.percent_of_equity, default_qty_value=20)' if is_strat else f'indicator("TradeAI Scalper Pro - {symbol}", shorttitle="TradeAI-Scalper", overlay=true)'}

// =============================================================================
// TradeAI Intraday AI Scalper Pro Strategy
// Asset: {symbol} ({name}) | Timeframe: {timeframe}
// =============================================================================

ema9 = ta.ema(close, 9)
ema21 = ta.ema(close, 21)
vwapVal = ta.vwap(close)
volM = volume > ta.sma(volume, 20)

scalpLong = ta.crossover(ema9, ema21) and (close > vwapVal) and volM
scalpExit = ta.crossunder(ema9, ema21) or (close < vwapVal)

plot(ema9, color=color.yellow, title="Fast EMA 9")
plot(ema21, color=color.blue, title="Slow EMA 21")
plot(vwapVal, color=color.orange, title="Session VWAP", linewidth=2)

{f'''if (scalpLong)
    strategy.entry("Scalp-Long", strategy.long, comment="AI Scalp Entry")

if (strategy.position_size > 0)
    stopVal = strategy.position_avg_price * (1 - ({sl_pct} / 100))
    takeVal = strategy.position_avg_price * (1 + ({tp_pct} / 100))
    strategy.exit("Scalp-TP/SL", "Scalp-Long", stop=stopVal, limit=takeVal)

if (scalpExit)
    strategy.close("Scalp-Long", comment="VWAP/EMA Reversal")
''' if is_strat else '''plotshape(scalpLong, title="Scalp Buy", style=shape.triangleup, location=location.belowbar, color=color.yellow, text="SCALP")
alertcondition(scalpLong, title="AI Scalp Buy", message="TradeAI Fast Scalp Entry Triggered on {{ticker}}")
'''}
"""
