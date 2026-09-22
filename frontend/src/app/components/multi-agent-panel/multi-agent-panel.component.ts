import { Component, Input, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeApiService } from '../../services/trade-api.service';
import { MultiAgentAnalysisResponse } from '../../models/trade.models';

interface AgentStepMeta {
  step: number;
  agent_name: string;
  role: string;
  summary: string;
  status: 'PENDING' | 'WORKING' | 'SUCCESS';
  execution_time_ms?: number;
}

@Component({
  selector: 'app-multi-agent-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="multi-agent-container glass-panel">
      <!-- Top Title & Telemetry Header -->
      <div class="panel-header">
        <div class="header-left">
          <div class="ai-badge">
            <span class="pulse-dot"></span>
            <span>MULTI-AGENT ORCHESTRATOR</span>
          </div>
          <h2 class="panel-title">
            TimesFM-3.0 + Gemini <span class="gradient-text">Neural Pipeline</span>
          </h2>
          <p class="panel-subtitle">
            Autonomous 6-agent collaborative synthesis: quantitative time-series foundation forecasting fused with qualitative LLM reasoning.
          </p>
        </div>

        <div class="header-right">
          <!-- Horizon Selector -->
          <div class="horizon-selector">
            <span class="control-label">Horizon:</span>
            <div class="pill-group">
              <button 
                *ngFor="let h of [3, 7, 14, 30]" 
                class="horizon-btn mono" 
                [class.active]="selectedHorizon === h"
                (click)="setHorizon(h)"
                [disabled]="isLoading"
              >
                {{ h }}D
              </button>
            </div>
          </div>

          <button class="run-pipeline-btn" (click)="executePipeline()" [disabled]="isLoading">
            <span *ngIf="!isLoading">⚡ Re-run Multi-Agent Pipeline</span>
            <span *ngIf="isLoading" class="loading-state">
              <span class="spinner"></span> Synthesizing Agents...
            </span>
          </button>
        </div>
      </div>

      <!-- Live Active Agent Working Banner (Visible during execution) -->
      <div class="active-agent-beacon" *ngIf="isLoading">
        <div class="beacon-radar">
          <div class="radar-ping"></div>
          <span class="beacon-icon">{{ getAgentIcon(currentActiveStep) }}</span>
        </div>
        <div class="beacon-content">
          <div class="beacon-top">
            <span class="beacon-tag mono">LIVE EXECUTION • STEP {{ currentActiveStep }} OF 6</span>
            <span class="beacon-agent-name">{{ agentSteps[currentActiveStep - 1]?.agent_name }}</span>
          </div>
          <p class="beacon-desc">{{ getActiveAgentDescription(currentActiveStep) }}</p>
        </div>
        <div class="beacon-progress-wrap">
          <div class="beacon-progress-bar" [style.width.%]="(currentActiveStep / 6) * 100"></div>
        </div>
      </div>

      <!-- Execution Progress / Pipeline 6-Step Flow Grid -->
      <div class="pipeline-flow-grid">
        <div 
          *ngFor="let stepInfo of agentSteps; let i = index" 
          class="agent-step-card"
          [class.card-working]="isLoading && currentActiveStep === (i + 1)"
          [class.card-completed]="(!isLoading && result) || (isLoading && currentActiveStep > (i + 1))"
          [class.card-pending]="isLoading && currentActiveStep < (i + 1)"
        >
          <div class="step-card-header">
            <span class="step-num-badge mono">STEP {{ stepInfo.step }}</span>
            <span class="step-status-chip" [ngClass]="getStepStatusClass(i + 1)">
              <ng-container *ngIf="isLoading && currentActiveStep === (i + 1)">
                <span class="status-spin"></span> ACTIVE
              </ng-container>
              <ng-container *ngIf="(!isLoading && result) || (isLoading && currentActiveStep > (i + 1))">
                ✓ DONE
              </ng-container>
              <ng-container *ngIf="isLoading && currentActiveStep < (i + 1)">
                WAITING
              </ng-container>
              <ng-container *ngIf="!isLoading && !result">
                IDLE
              </ng-container>
            </span>
          </div>

          <div class="agent-title-row">
            <span class="agent-icon">{{ getAgentIcon(stepInfo.step) }}</span>
            <strong class="agent-name">{{ stepInfo.agent_name }}</strong>
          </div>

          <p class="agent-summary-text">
            {{ getStepSummary(i) }}
          </p>

          <div class="agent-footer-meta mono">
            <span class="role-tag">{{ stepInfo.role }}</span>
            <span class="time-chip" *ngIf="getStepExecutionTime(i)">
              {{ getStepExecutionTime(i) }}ms
            </span>
          </div>
        </div>
      </div>

      <!-- Main Synthesis Result Grid -->
      <div class="synthesis-results-grid" *ngIf="result && !isLoading">
        <!-- Key Signal & Target Channel Card -->
        <div class="decision-card glass-panel">
          <div class="decision-header">
            <span class="card-label">FUSED AI SIGNAL</span>
            <span class="confidence-badge mono">{{ result.final_signal.confidence }}% CONFIDENCE</span>
          </div>

          <div class="action-display" [ngClass]="getActionClass(result.final_signal.action)">
            <span class="action-title">{{ result.final_signal.action }}</span>
            <span class="roi-tag mono">{{ result.final_signal.expected_roi_pct >= 0 ? '+' : '' }}{{ result.final_signal.expected_roi_pct }}% ROI</span>
          </div>

          <!-- Target Price Channel Visualizer -->
          <div class="channel-visualizer">
            <div class="channel-point stop-loss">
              <span class="point-label">STOP LOSS (Q10)</span>
              <strong class="mono">{{ result.currency }}{{ result.final_signal.stop_loss | number:'1.2-2' }}</strong>
            </div>
            <div class="channel-divider">➔</div>
            <div class="channel-point current">
              <span class="point-label">CURRENT PRICE</span>
              <strong class="mono">{{ result.currency }}{{ result.current_price | number:'1.2-2' }}</strong>
            </div>
            <div class="channel-divider">➔</div>
            <div class="channel-point target">
              <span class="point-label">TARGET (Q90)</span>
              <strong class="mono">{{ result.currency }}{{ result.final_signal.target_price | number:'1.2-2' }}</strong>
            </div>
          </div>

          <!-- TimesFM Horizon Trajectory Points -->
          <div class="trajectory-preview">
            <span class="sub-label">TimesFM 3.0 Autoregressive Path ({{ result.timesfm_forecast.horizon_days }} Days):</span>
            <div class="points-row">
              <div *ngFor="let pt of result.timesfm_forecast.forecast_points" class="point-chip mono">
                <span class="day-tag">{{ pt.day_name || 'D' + pt.day }}</span>
                <span class="price-tag">{{ result.currency }}{{ pt.predicted_close | number:'1.1-1' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gemini Reasoning & Catalyst Narrative Card -->
        <div class="reasoning-card glass-panel">
          <div class="reasoning-header">
            <span class="card-label">GEMINI QUALITATIVE REASONING</span>
            <span class="alignment-chip" [ngClass]="getAlignmentClass(result.gemini_reasoning.alignment_status)">
              {{ result.gemini_reasoning.alignment_status }}
            </span>
          </div>

          <p class="reasoning-text">
            {{ result.gemini_reasoning.critique }}
          </p>

          <div class="catalysts-section">
            <span class="sub-label">Primary Catalytic Drivers:</span>
            <div class="catalysts-tags">
              <span *ngFor="let cat of result.final_signal.technical_catalysts" class="cat-tag">
                ✦ {{ cat }}
              </span>
            </div>
          </div>

          <!-- Risk Guardrails & Licensing Disclaimer Accordion -->
          <div class="risk-notice-box">
            <div class="risk-title-row">
              <span class="shield-mini">🛡️</span>
              <span class="risk-title">Risk Flags & Licensing Guardrails:</span>
            </div>
            <ul class="risk-list">
              <li *ngFor="let flag of result.risk_assessment.risk_flags">
                {{ flag }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .multi-agent-container {
      padding: 28px;
      border-radius: 18px;
      margin: 20px 0;
      border: 1px solid rgba(0, 242, 254, 0.25);
      background: rgba(13, 17, 23, 0.85);
      color: #fff;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }

    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 242, 254, 0.12);
      border: 1px solid rgba(0, 242, 254, 0.35);
      color: #00f2fe;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.6px;
      margin-bottom: 8px;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 6px #00f2fe;
      animation: pulseGlow 1.5s infinite;
    }

    .panel-title {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .panel-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
      max-width: 650px;
      line-height: 1.4;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .horizon-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .control-label {
      font-size: 0.75rem;
      color: var(--text-secondary, #94a3b8);
      font-weight: 600;
    }
    .pill-group {
      display: flex;
      background: rgba(0, 0, 0, 0.4);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .horizon-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary, #94a3b8);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .horizon-btn.active {
      background: rgba(0, 242, 254, 0.2);
      color: #00f2fe;
      border: 1px solid rgba(0, 242, 254, 0.4);
    }
    .horizon-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .run-pipeline-btn {
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      border: none;
      color: #06090e;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 10px 18px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .run-pipeline-btn:hover:not(:disabled) {
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
      transform: translateY(-1px);
    }
    .run-pipeline-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Active Agent Beacon Banner */
    .active-agent-beacon {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(59, 130, 246, 0.15) 100%);
      border: 1px solid rgba(0, 242, 254, 0.5);
      box-shadow: 0 0 25px rgba(0, 242, 254, 0.2);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 18px;
      margin-bottom: 22px;
      animation: beaconFadeIn 0.3s ease;
    }

    .beacon-radar {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(0, 242, 254, 0.2);
      border: 1px solid #00f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .beacon-icon {
      font-size: 1.3rem;
      z-index: 2;
    }
    .radar-ping {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid #00f2fe;
      animation: radarPulse 1.4s cubic-bezier(0, 0.2, 0.8, 1) infinite;
    }

    .beacon-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .beacon-top {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .beacon-tag {
      font-size: 0.68rem;
      font-weight: 800;
      color: #00f2fe;
      letter-spacing: 0.8px;
      background: rgba(0, 242, 254, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .beacon-agent-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #fff;
    }
    .beacon-desc {
      font-size: 0.8rem;
      color: var(--text-secondary, #cbd5e1);
      margin: 0;
    }
    .beacon-progress-wrap {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
    }
    .beacon-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #00f2fe, #38bdf8);
      box-shadow: 0 0 10px #00f2fe;
      transition: width 0.4s ease;
    }

    /* 6-Step Pipeline Grid */
    .pipeline-flow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .agent-step-card {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.25s ease;
    }
    
    /* Card states */
    .agent-step-card.card-working {
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.12), rgba(14, 165, 233, 0.08));
      border: 1px solid #00f2fe;
      box-shadow: 0 0 18px rgba(0, 242, 254, 0.3);
      transform: translateY(-2px);
    }
    .agent-step-card.card-completed {
      border-color: rgba(16, 185, 129, 0.35);
      background: rgba(16, 185, 129, 0.04);
    }
    .agent-step-card.card-pending {
      opacity: 0.45;
    }

    .step-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .step-num-badge {
      font-size: 0.6rem;
      font-weight: 800;
      color: var(--text-muted, #94a3b8);
      letter-spacing: 0.8px;
    }
    .card-working .step-num-badge {
      color: #00f2fe;
    }
    .step-status-chip {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font-mono);
    }
    .status-working {
      background: rgba(0, 242, 254, 0.2);
      color: #00f2fe;
      border: 1px solid rgba(0, 242, 254, 0.4);
    }
    .status-done {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .status-waiting {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted, #64748b);
    }

    .status-spin {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      border: 1px solid #00f2fe;
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    .agent-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .agent-icon {
      font-size: 1rem;
    }
    .agent-name {
      font-size: 0.75rem;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .agent-summary-text {
      font-size: 0.7rem;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .agent-footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.65rem;
    }
    .role-tag {
      color: var(--text-muted, #64748b);
      font-size: 0.6rem;
    }
    .time-chip {
      color: #10b981;
      font-weight: 700;
    }

    /* Synthesis Grid */
    .synthesis-results-grid {
      display: grid;
      grid-template-columns: 1fr 1.15fr;
      gap: 20px;
    }

    .decision-card, .reasoning-card {
      padding: 22px;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .decision-header, .reasoning-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-label {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: var(--text-secondary, #94a3b8);
    }
    .confidence-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .action-display {
      display: flex;
      align-items: baseline;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 10px;
    }
    .action-display.strong-buy { background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; }
    .action-display.buy { background: rgba(0, 242, 254, 0.15); border: 1px solid rgba(0, 242, 254, 0.35); color: #00f2fe; }
    .action-display.hold { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #f59e0b; }
    .action-display.sell, .action-display.strong-sell { background: rgba(244, 63, 94, 0.2); border: 1px solid rgba(244, 63, 94, 0.4); color: #f43f5e; }

    .action-title {
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .roi-tag {
      font-size: 1.1rem;
      font-weight: 800;
    }

    .channel-visualizer {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 12px;
      border-radius: 10px;
      text-align: center;
    }
    .channel-point {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .channel-point.stop-loss strong { color: #f43f5e; }
    .channel-point.current strong { color: #fff; }
    .channel-point.target strong { color: #10b981; }
    .point-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--text-muted, #64748b);
    }
    .channel-divider {
      color: var(--text-muted, #64748b);
      font-size: 0.8rem;
    }

    .trajectory-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sub-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-secondary, #94a3b8);
    }
    .points-row {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .point-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 4px 8px;
      border-radius: 6px;
      min-width: 52px;
    }
    .day-tag { font-size: 0.6rem; color: var(--text-muted, #64748b); }
    .price-tag { font-size: 0.72rem; color: #00f2fe; font-weight: 700; }

    /* Reasoning Card Styles */
    .alignment-chip {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }
    .chip-aligned { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .chip-neutral { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .chip-divergent { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

    .reasoning-text {
      font-size: 0.85rem;
      color: #fff;
      line-height: 1.5;
      margin: 0;
    }

    .catalysts-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .catalysts-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .cat-tag {
      background: rgba(0, 242, 254, 0.08);
      border: 1px solid rgba(0, 242, 254, 0.2);
      color: #38bdf8;
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .risk-notice-box {
      background: rgba(245, 158, 11, 0.06);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 0.75rem;
    }
    .risk-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 6px;
    }
    .risk-list {
      margin: 0;
      padding-left: 18px;
      color: var(--text-secondary, #94a3b8);
      line-height: 1.4;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: #06090e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes radarPulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes beaconFadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
      .synthesis-results-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MultiAgentPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() symbol: string = 'TATASIL';
  @Input() riskTolerance: string = 'MODERATE';

  selectedHorizon: number = 7;
  isLoading: boolean = false;
  currentActiveStep: number = 1;
  private stepIntervalId: any = null;

  result: MultiAgentAnalysisResponse | null = null;

  agentSteps: AgentStepMeta[] = [
    { step: 1, agent_name: 'Market Data Agent', role: 'DATA INGESTION', summary: 'Ingesting daily OHLCV bars & calculating RSI/SMA indicators...', status: 'PENDING' },
    { step: 2, agent_name: 'News & Sentiment Agent (Gemini)', role: 'QUALITATIVE NLP', summary: 'Parsing financial news headlines & calculating sentiment polarities...', status: 'PENDING' },
    { step: 3, agent_name: 'Quant Forecaster (TimesFM-3.0)', role: 'FOUNDATION MODEL', summary: 'Autoregressive multi-horizon forecasting with Q10-Q90 intervals...', status: 'PENDING' },
    { step: 4, agent_name: 'Reasoning Agent (Gemini)', role: 'QUALITATIVE AUDIT', summary: 'Cross-examining quant projection against macro & industry catalysts...', status: 'PENDING' },
    { step: 5, agent_name: 'Fusion & Risk Agent (Gemini)', role: 'RISK RECONCILIATION', summary: 'Reconciling forecast channels, stop losses, and guardrail constraints...', status: 'PENDING' },
    { step: 6, agent_name: 'Output Agent', role: 'SYNTHESIS PACKET', summary: 'Structuring final executive consensus recommendation and trace metadata...', status: 'PENDING' }
  ];

  constructor(private api: TradeApiService) {}

  ngOnInit(): void {
    this.executePipeline();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && !changes['symbol'].firstChange) {
      this.executePipeline();
    }
  }

  ngOnDestroy(): void {
    this.stopStepSimulation();
  }

  setHorizon(h: number): void {
    if (this.isLoading) return;
    this.selectedHorizon = h;
    this.executePipeline();
  }

  executePipeline(): void {
    if (!this.symbol) return;
    this.isLoading = true;
    this.currentActiveStep = 1;
    this.startStepSimulation();

    this.api.getMultiAgentAnalysis(this.symbol, this.selectedHorizon, this.riskTolerance).subscribe({
      next: (res) => {
        this.result = res;
        this.currentActiveStep = 6;
        this.stopStepSimulation();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Multi-Agent pipeline error', err);
        this.stopStepSimulation();
        this.isLoading = false;
      }
    });
  }

  private startStepSimulation(): void {
    this.stopStepSimulation();
    this.stepIntervalId = setInterval(() => {
      if (this.currentActiveStep < 5) {
        this.currentActiveStep++;
      }
    }, 750);
  }

  private stopStepSimulation(): void {
    if (this.stepIntervalId) {
      clearInterval(this.stepIntervalId);
      this.stepIntervalId = null;
    }
  }

  getAgentIcon(step: number): string {
    const icons = ['📊', '📰', '🧠', '🔍', '⚖️', '📈'];
    return icons[step - 1] || '🤖';
  }

  getActiveAgentDescription(step: number): string {
    const descriptions = [
      'Querying exchange servers for historical OHLCV data and computing RSI(14), SMA(20), SMA(50), and volatility matrices...',
      'Google Gemini is analyzing news sentiment, earnings transcripts, and sectoral news velocity...',
      'Google TimesFM 3.0 foundation model is executing zero-shot autoregressive inference with 10th & 90th quantile channels...',
      'Google Gemini is auditing numeric price targets against real-world qualitative market conditions and sector rotation...',
      'Calibrating trade conviction, computing Stop Loss (Q10) & Take Profit (Q90), and applying licensing safety checks...',
      'Finalizing executive intelligence dossier and compiling complete agent timeline telemetry...'
    ];
    return descriptions[step - 1] || 'Processing autonomous agent workflow...';
  }

  getStepStatusClass(step: number): string {
    if (this.isLoading) {
      if (step === this.currentActiveStep) return 'status-working';
      if (step < this.currentActiveStep) return 'status-done';
      return 'status-waiting';
    }
    return this.result ? 'status-done' : 'status-waiting';
  }

  getStepSummary(index: number): string {
    if (this.result?.agent_execution_traces && this.result.agent_execution_traces[index]) {
      return this.result.agent_execution_traces[index].summary;
    }
    return this.agentSteps[index].summary;
  }

  getStepExecutionTime(index: number): number | undefined {
    if (this.result?.agent_execution_traces && this.result.agent_execution_traces[index]) {
      return this.result.agent_execution_traces[index].execution_time_ms;
    }
    return undefined;
  }

  getActionClass(action: string): string {
    const a = action.toUpperCase();
    if (a.includes('STRONG BUY')) return 'strong-buy';
    if (a.includes('BUY')) return 'buy';
    if (a.includes('HOLD')) return 'hold';
    if (a.includes('STRONG SELL')) return 'strong-sell';
    return 'sell';
  }

  getAlignmentClass(status: string): string {
    if (status.includes('BULLISH') || status.includes('BEARISH')) return 'chip-aligned';
    if (status.includes('DIVERGENT')) return 'chip-divergent';
    return 'chip-neutral';
  }
}
