import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentResult(BaseModel):
    agent_name: str
    status: str = "SUCCESS" # "SUCCESS", "WARNING", "ERROR"
    execution_time_ms: float = 0.0
    summary: str = ""
    data: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None

class BaseAgent(ABC):
    """
    Abstract Base Class for all TradeAI Multi-Agent Pipeline Agents.
    Provides execution timing, standardized logging, and error handling.
    """
    def __init__(self, name: str):
        self.name = name

    def execute(self, state: Dict[str, Any]) -> AgentResult:
        start_time = time.perf_counter()
        try:
            result = self.run(state)
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            result.execution_time_ms = elapsed_ms
            return result
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            print(f"[{self.name} Error]: {e}")
            return AgentResult(
                agent_name=self.name,
                status="ERROR",
                execution_time_ms=elapsed_ms,
                summary=f"Execution error in {self.name}: {str(e)}",
                error=str(e),
                data={}
            )

    @abstractmethod
    def run(self, state: Dict[str, Any]) -> AgentResult:
        """Core execution logic implemented by each specific agent."""
        pass
