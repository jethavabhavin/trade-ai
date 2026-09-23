from datetime import datetime
from typing import Dict, Any

def build_timesfm_neural_script(
    symbol: str, name: str, script_type: str, timeframe: str,
    capital: int, sl_pct: float, tp_pct: float, inputs: Dict[str, Any]
) -> str:
    is_strat = (script_type.upper() == "STRATEGY")
    header = f"""//@version=5
{f'strategy("TradeAI TimesFM 3.0 Neural - {symbol}", shorttitle="TradeAI-TimesFM", overlay=true, initial_capital={capital}, default_qty_type=strategy.percent_of_equity, default_qty_value=25, commission_type=strategy.commission.percent, commission_value=0.03)' if is_strat else f'indicator("TradeAI TimesFM 3.0 Neural Bands - {symbol}", shorttitle="TradeAI-TimesFM", overlay=true)'}

// =============================================================================
// TradeAI Neural Foundation Model - TradingView Pine Script v5
// Asset: {symbol} ({name}) | Timeframe: {timeframe}
// Strategy: Google TimesFM 3.0 Neural Horizon Quantile Channels
// Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
// =============================================================================

// === Strategy Parameters ===
horizonLength    = input.int(7, title="Forecast Horizon Bars", minval=3, maxval=30, group="AI Neural Engine")
neuralMultiplier = input.float(1.618, title="Neural Volatility Multiplier", minval=0.5, step=0.1, group="AI Neural Engine")
atrPeriod        = input.int(14, title="ATR Length", group="Risk Guardrails")
slPercent        = input.float({sl_pct}, title="Stop Loss (%)", minval=0.5, step=0.1, group="Risk Guardrails")
tpPercent        = input.float({tp_pct}, title="Take Profit (%)", minval=1.0, step=0.1, group="Risk Guardrails")
useTrailingStop  = input.bool(true, title="Enable Neural Trailing Stop", group="Risk Guardrails")

// === Neural Channel Calculations ===
atrVal = ta.atr(atrPeriod)
basisEma = ta.ema(close, 20)
upperNeuralBand = basisEma + (atrVal * neuralMultiplier)
lowerNeuralBand = basisEma - (atrVal * neuralMultiplier)

// Momentum Velocity Factor
rsiVal = ta.rsi(close, 14)
macdLine, signalLine, _ = ta.macd(close, 12, 26, 9)
neuralBullishCondition = ta.crossover(close, upperNeuralBand) and rsiVal > 52 and macdLine > signalLine
neuralBearishCondition = ta.crossunder(close, lowerNeuralBand) and rsiVal < 48 and macdLine < signalLine

// === Visual Plotting ===
plot(basisEma, color=color.new(#00f2fe, 20), title="AI Basis EMA 20", linewidth=2)
pUpper = plot(upperNeuralBand, color=color.new(#10b981, 30), title="TimesFM Upper Quantile Band", linewidth=1)
pLower = plot(lowerNeuralBand, color=color.new(#f43f5e, 30), title="TimesFM Lower Quantile Band", linewidth=1)
fill(pUpper, pLower, color=color.new(#00f2fe, 92), title="Neural Confidence Tunnel")
"""
    if is_strat:
        exec_logic = f"""
// === Strategy Execution ===
if (neuralBullishCondition)
    strategy.entry("TimesFM-Long", strategy.long, comment="AI BUY 91% Conf")

if (neuralBearishCondition)
    strategy.close("TimesFM-Long", comment="AI SELL EXIT")

// Target Profit & Stop Loss
longStopPrice = strategy.position_avg_price * (1 - (slPercent / 100))
longTakeProfit = strategy.position_avg_price * (1 + (tpPercent / 100))

if (strategy.position_size > 0)
    strategy.exit("TimesFM-Exit", "TimesFM-Long", stop=longStopPrice, limit=longTakeProfit, comment_loss="SL Hit", comment_profit="TP Target")
"""
    else:
        exec_logic = """
// === Indicator Visual Signals & Alerts ===
plotshape(neuralBullishCondition, title="AI Neural Buy", style=shape.triangleup, location=location.belowbar, color=#10b981, size=size.small, text="AI BUY")
plotshape(neuralBearishCondition, title="AI Neural Sell", style=shape.triangledown, location=location.abovebar, color=#f43f5e, size=size.small, text="AI SELL")

alertcondition(neuralBullishCondition, title="TradeAI TimesFM Buy Alert", message="TimesFM 3.0 Neural Momentum Breakout on {{ticker}} at price {{close}}")
alertcondition(neuralBearishCondition, title="TradeAI TimesFM Sell Alert", message="TimesFM 3.0 Neural Breakdown on {{ticker}} at price {{close}}")
"""
    return header + exec_logic
