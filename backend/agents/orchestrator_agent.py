import time
from typing import Dict, Any, List
try:
    from backend.agents.base_agent import BaseAgent, AgentResult
    from backend.agents.market_data_agent import MarketDataAgent
    from backend.agents.sentiment_agent import SentimentAgent
    from backend.agents.quant_forecaster_agent import QuantForecasterAgent
    from backend.agents.reasoning_agent import ReasoningAgent
    from backend.agents.fusion_risk_agent import FusionRiskAgent
    from backend.agents.output_agent import OutputAgent
except ImportError:
    from agents.base_agent import BaseAgent, AgentResult
    from agents.market_data_agent import MarketDataAgent
    from agents.sentiment_agent import SentimentAgent
    from agents.quant_forecaster_agent import QuantForecasterAgent
    from agents.reasoning_agent import ReasoningAgent
    from agents.fusion_risk_agent import FusionRiskAgent
    from agents.output_agent import OutputAgent

class OrchestratorAgent(BaseAgent):
    """
    Orchestrator Agent:
    Coordinates the 6-agent state graph pipeline for TradeAI.
    Manages workflow routing, data propagation, timing telemetry, and trace assembly.
    """
    def __init__(self):
        super().__init__(name="Orchestrator Agent")
        self.market_agent = MarketDataAgent()
        self.sentiment_agent = SentimentAgent()
        self.quant_agent = QuantForecasterAgent()
        self.reasoning_agent = ReasoningAgent()
        self.fusion_agent = FusionRiskAgent()
        self.output_agent = OutputAgent()

    def run(self, state: Dict[str, Any]) -> AgentResult:
        pipeline_start = time.perf_counter()
        traces: List[Dict[str, Any]] = []

        symbol = state.get("symbol", "TATASIL").upper()
        horizon = int(state.get("horizon", 7))
        risk_tolerance = state.get("risk_tolerance", "MODERATE")

        # Step 1: Collect Market Data (OHLCV, Fundamentals, Indicators)
        market_res = self.market_agent.execute(state)
        state["market_data"] = market_res.data
        traces.append(self._to_trace_dict(1, self.market_agent.name, market_res))

        # Step 2: News & Sentiment Analysis (Gemini)
        sentiment_res = self.sentiment_agent.execute(state)
        state["sentiment_data"] = sentiment_res.data
        traces.append(self._to_trace_dict(2, self.sentiment_agent.name, sentiment_res))

        # Step 3: Google TimesFM 3.0 Quantitative Forecasting
        quant_res = self.quant_agent.execute(state)
        state["quant_data"] = quant_res.data
        traces.append(self._to_trace_dict(3, self.quant_agent.name, quant_res))

        # Step 4: Qualitative Reasoning & Consistency Cross-Check (Gemini)
        reasoning_res = self.reasoning_agent.execute(state)
        state["reasoning_data"] = reasoning_res.data
        traces.append(self._to_trace_dict(4, self.reasoning_agent.name, reasoning_res))

        # Step 5: Fusion & Risk Synthesis (Gemini)
        fusion_res = self.fusion_agent.execute(state)
        state["fusion_data"] = fusion_res.data
        traces.append(self._to_trace_dict(5, self.fusion_agent.name, fusion_res))

        # Step 6: Output & Visualization Compilation
        state["agent_traces"] = traces
        output_res = self.output_agent.execute(state)
        traces.append(self._to_trace_dict(6, self.output_agent.name, output_res))

        total_elapsed_ms = round((time.perf_counter() - pipeline_start) * 1000, 2)
        final_packet = output_res.data
        final_packet["total_pipeline_time_ms"] = total_elapsed_ms

        summary = (
            f"Successfully executed 6-agent TradeAI pipeline for {symbol} in {total_elapsed_ms}ms. "
            f"Action: {final_packet.get('final_signal', {}).get('action', 'BUY')}."
        )

        return AgentResult(
            agent_name=self.name,
            status="SUCCESS",
            execution_time_ms=total_elapsed_ms,
            summary=summary,
            data=final_packet
        )

    def _to_trace_dict(self, step: int, agent_name: str, res: AgentResult) -> Dict[str, Any]:
        return {
            "step": step,
            "agent_name": agent_name,
            "status": res.status,
            "execution_time_ms": res.execution_time_ms,
            "summary": res.summary,
            "error": res.error
        }

# Global singleton orchestrator
orchestrator = OrchestratorAgent()
