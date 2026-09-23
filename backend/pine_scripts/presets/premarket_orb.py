from typing import Dict, Any

def build_premarket_momentum_script(
    symbol: str, name: str, script_type: str, timeframe: str,
    capital: int, sl_pct: float, tp_pct: float, inputs: Dict[str, Any]
) -> str:
    is_strat = (script_type.upper() == "STRATEGY")
    return f"""//@version=5
{f'strategy("TradeAI 9:00 AM Pre-Market - {symbol}", shorttitle="TradeAI-9AM", overlay=true, initial_capital={capital}, default_qty_type=strategy.percent_of_equity, default_qty_value=20)' if is_strat else f'indicator("TradeAI 9:00 AM Pre-Market - {symbol}", shorttitle="TradeAI-9AM", overlay=true)'}

// =============================================================================
// TradeAI 9:00 AM Pre-Market Opening Strategy
// Asset: {symbol} ({name}) | Timeframe: {timeframe}
// =============================================================================

// === User Inputs ===
slPct = input.float({sl_pct}, title="Stop Loss (%)", minval=0.5, step=0.1)
tpPct = input.float({tp_pct}, title="Take Profit (%)", minval=1.0, step=0.1)
volMultiplier = input.float(1.5, title="Volume Expansion Threshold", step=0.1)

// === Session & Volume Calculation ===
isNewDay = ta.change(time("D")) != 0
var float openPrice = na
if isNewDay
    openPrice := open

volEma = ta.ema(volume, 20)
hasVolSurge = volume > (volEma * volMultiplier)
emaFast = ta.ema(close, 9)
emaSlow = ta.ema(close, 21)

buyTrigger = ta.crossover(emaFast, emaSlow) and hasVolSurge and close > openPrice
sellTrigger = ta.crossunder(emaFast, emaSlow) and close < openPrice

plot(emaFast, color=color.green, title="EMA 9", linewidth=2)
plot(emaSlow, color=color.red, title="EMA 21", linewidth=2)
plotshape(buyTrigger, title="9 AM Buy Signal", style=shape.labelup, location=location.belowbar, color=#10b981, text="9AM BUY", textcolor=color.white)
plotshape(sellTrigger, title="9 AM Sell Signal", style=shape.labeldown, location=location.abovebar, color=#f43f5e, text="9AM SELL", textcolor=color.white)

{f'''if (buyTrigger)
    strategy.entry("9AM-Long", strategy.long, comment="9:00 AM AI Signal")

if (strategy.position_size > 0)
    stopP = strategy.position_avg_price * (1 - (slPct / 100))
    targP = strategy.position_avg_price * (1 + (tpPct / 100))
    strategy.exit("9AM-Exit", "9AM-Long", stop=stopP, limit=targP)
''' if is_strat else '''alertcondition(buyTrigger, title="9:00 AM Pre-Market AI Buy", message="TradeAI 9 AM Momentum Signal on {{ticker}} at {{close}}")
alertcondition(sellTrigger, title="9:00 AM Pre-Market AI Sell", message="TradeAI 9 AM Exit Signal on {{ticker}} at {{close}}")
'''}
"""
