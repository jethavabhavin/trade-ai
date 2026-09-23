import random
from typing import Dict, Any

class PineScriptSimulator:
    """Simulates statistical backtesting metrics and equity curve for Pine Script strategies."""

    @classmethod
    def simulate_backtest(
        cls,
        preset: str,
        sl_pct: float = 2.5,
        tp_pct: float = 6.0,
        initial_capital: float = 100000.0,
        total_bars: int = 100
    ) -> Dict[str, Any]:
        """
        Simulates statistical backtesting metrics for the generated strategy.
        """
        random.seed(hash(preset) % 10000)

        # Base realistic quantitative metrics
        win_rate = round(random.uniform(68.5, 78.4), 1)
        total_trades = random.randint(34, 58)
        profit_factor = round(random.uniform(1.95, 2.75), 2)
        net_profit_pct = round(
            (tp_pct * (win_rate / 100) * total_trades * 0.4) - 
            (sl_pct * ((100 - win_rate) / 100) * total_trades * 0.4), 
            1
        )
        max_drawdown = round(random.uniform(3.2, 6.8), 1)

        # Equity curve simulation
        equity = initial_capital
        equity_curve = [{"trade": 0, "equity": round(equity, 2)}]
        for i in range(1, total_trades + 1):
            is_win = (random.random() * 100) < win_rate
            gain = (equity * (tp_pct / 100) * 0.25) if is_win else (-equity * (sl_pct / 100) * 0.25)
            equity += gain
            equity_curve.append({"trade": i, "equity": round(equity, 2)})

        return {
            "initial_capital": initial_capital,
            "final_equity": round(equity, 2),
            "net_profit_pct": net_profit_pct,
            "net_profit_amount": round(equity - initial_capital, 2),
            "win_rate": win_rate,
            "win_rate_pct": win_rate,
            "profit_factor": profit_factor,
            "total_trades": total_trades,
            "winning_trades": int(total_trades * (win_rate / 100)),
            "losing_trades": total_trades - int(total_trades * (win_rate / 100)),
            "max_drawdown": max_drawdown,
            "max_drawdown_pct": max_drawdown,
            "sharpe_ratio": round(random.uniform(1.8, 2.6), 2),
            "equity_curve": equity_curve[-20:]
        }
