from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DataIntegrityAudit(BaseModel):
    all_required_feeds_present: bool
    unverified_or_missing_dimensions: List[str] = Field(default_factory=list)
    data_freshness_verified: bool = True

class GovernanceAndFraudAssessment(BaseModel):
    active_infractions_found: bool
    verified_evidence_citations: List[str] = Field(default_factory=list)
    governance_threat_level: str  # NONE | LOW | MODERATE | SEVERE_CRISIS | UNVERIFIED_DATA

class SectorContagionAndPeerImpact(BaseModel):
    peer_breadth_state: str  # SECTOR_RALLY | SECTOR_DRAG | MIXED_CONSOLIDATION | UNVERIFIED_DATA
    peer_correlation_analysis: str
    peer_drag_factor: float = Field(..., ge=-1.0, le=1.0)

class GeopoliticalAndCrudePressure(BaseModel):
    threat_level: str  # NEGLIGIBLE | ELEVATED | HIGH | SEVERE | UNVERIFIED_DATA
    crude_impact_mechanism: str
    chokepoint_disruption_active: bool

class MacroRatesAndForexFlight(BaseModel):
    fii_liquidity_environment: str  # ACCUMULATION | NEUTRAL | OUTFLOW_PRESSURE | AGGRESSIVE_LIQUIDATION
    rate_divergence_pressure: str
    currency_depreciation_risk: str  # LOW | MODERATE | HIGH

class EvidenceBasedRiskAudit(BaseModel):
    governance_and_fraud_assessment: GovernanceAndFraudAssessment
    sector_contagion_and_peer_impact: SectorContagionAndPeerImpact
    geopolitical_and_crude_pressure: GeopoliticalAndCrudePressure
    macro_rates_and_forex_flight: MacroRatesAndForexFlight

class QuantitativeAdjustments(BaseModel):
    composite_macro_score: float = Field(..., ge=-1.0, le=1.0)
    timesfm_covariate_factor: float = Field(..., ge=0.70, le=1.30)
    recommended_stop_loss_buffer_pct: float = Field(..., ge=0.5, le=3.5)
    trade_veto_activated: bool
    veto_justification: Optional[str] = None

class FinalAuditSummary(BaseModel):
    executive_verdict: str  # STRONG BUY | BUY | HOLD | SELL | STRONG SELL | AVOID_SYSTEMIC_RISK
    grounded_conviction_score: int = Field(..., ge=0, le=100)
    evidence_summary: str

class MacroContagionAuditResponse(BaseModel):
    symbol: str
    payload_timestamp_utc: str
    data_integrity_audit: DataIntegrityAudit
    evidence_based_risk_audit: EvidenceBasedRiskAudit
    quantitative_adjustments: QuantitativeAdjustments
    final_audit_summary: FinalAuditSummary
