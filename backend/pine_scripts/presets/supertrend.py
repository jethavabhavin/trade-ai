from typing import Dict, Any

def build_supertrend_script(
    symbol: str, name: str, script_type: str, timeframe: str,
    capital: int, sl_pct: float, tp_pct: float, inputs: Dict[str, Any]
) -> str:
    is_strat = (script_type.upper() == "STRATEGY")
    return f"""//@version=5
{f'strategy("TradeAI Dual SuperTrend & RSI - {symbol}", shorttitle="TradeAI-SuperTrend", overlay=true, initial_capital={capital}, default_qty_type=strategy.percent_of_equity, default_qty_value=30)' if is_strat else f'indicator("TradeAI Dual SuperTrend & RSI - {symbol}", shorttitle="TradeAI-SuperTrend", overlay=true)'}

// =============================================================================
// TradeAI Dual SuperTrend + 200 EMA + RSI Filter
// Asset: {symbol} ({name}) | Timeframe: {timeframe}
// =============================================================================

atrPeriod = input.int(10, title="ATR Period")
factorFast = input.float(3.0, title="Fast SuperTrend Factor")
factorSlow = input.float(6.0, title="Slow SuperTrend Factor")
emaMacroPeriod = input.int(200, title="Macro Trend EMA")

[stFast, dirFast] = ta.supertrend(factorFast, atrPeriod)
[stSlow, dirSlow] = ta.supertrend(factorSlow, atrPeriod)
macroEma = ta.ema(close, emaMacroPeriod)
rsi14 = ta.rsi(close, 14)

longCondition = (dirFast == -1) and (dirSlow == -1) and (close > macroEma) and (rsi14 > 50)
exitCondition = (dirFast == 1) or (close < stFast)

plot(macroEma, color=color.purple, title="Macro 200 EMA", linewidth=2)
plot(dirFast == -1 ? stFast : na, color=color.green, title="SuperTrend Fast Up", style=plot.style_linebr, linewidth=2)
plot(dirFast == 1 ? stFast : na, color=color.red, title="SuperTrend Fast Down", style=plot.style_linebr, linewidth=2)

{f'''if (longCondition)
    strategy.entry("ST-Long", strategy.long, comment="SuperTrend AI Confirmed")

if (exitCondition)
    strategy.close("ST-Long", comment="SuperTrend Exit")
''' if is_strat else '''plotshape(longCondition and not longCondition[1], title="SuperTrend Buy", style=shape.triangleup, location=location.belowbar, color=color.green, size=size.small, text="BUY")
alertcondition(longCondition, title="SuperTrend Long Alert", message="TradeAI Dual SuperTrend Buy on {{ticker}} at {{close}}")
'''}
"""
