import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MorningSignal } from '../../models/trade.models';

@Component({
  selector: 'app-morning-signal-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="morning-card glass-panel" [ngClass]="getCardBorderClass(signal.action)">
      <!-- Top Row: Time, Asset & Signal Action -->
      <div class="card-header">
        <div class="asset-info">
          <div class="symbol-row">
            <span class="symbol-tag">{{ signal.symbol }}</span>
            <span class="time-stamp mono">Generated {{ signal.generated_at }}</span>
          </div>
          <h3 class="asset-name" [routerLink]="['/stock', signal.symbol]">{{ signal.name }}</h3>
        </div>

        <div class="signal-badge-wrapper">
          <span class="badge" [ngClass]="getBadgeClass(signal.action)">
            <span class="pulse-dot"></span>
            {{ signal.action }}
          </span>
          <span class="confidence-tag mono">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            {{ signal.confidence }}% AI Match
          </span>
        </div>
      </div>

      <!-- Price Target Grid -->
      <div class="price-targets-grid">
        <div class="target-item">
          <span class="lbl">Entry / Current</span>
          <span class="val mono">₹{{ signal.current_price | number:'1.2-2' }}</span>
        </div>
        <div class="target-item">
          <span class="lbl">Target Price</span>
          <span class="val mono target-val" [class.text-bullish]="signal.action.includes('BUY')" [class.text-bearish]="signal.action.includes('SELL')">
            ₹{{ signal.target_price | number:'1.2-2' }}
          </span>
        </div>
        <div class="target-item">
          <span class="lbl">Stop Loss</span>
          <span class="val mono sl-val">₹{{ signal.stop_loss | number:'1.2-2' }}</span>
        </div>
        <div class="target-item">
          <span class="lbl">Expected ROI</span>
          <span class="val mono roi-val" [class.text-bullish]="signal.expected_roi_pct > 0" [class.text-bearish]="signal.expected_roi_pct < 0">
            {{ signal.expected_roi_pct > 0 ? '+' : '' }}{{ signal.expected_roi_pct }}%
          </span>
        </div>
      </div>

      <!-- AI Catalyst & Rationale -->
      <div class="rationale-box">
        <div class="rationale-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.5">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
          <span class="ai-lbl">9:00 AM AI Intelligence Rationale</span>
        </div>
        <p class="rationale-text">{{ signal.rationale }}</p>

        <!-- Technical Catalysts Chips -->
        <div class="catalysts-list">
          <span *ngFor="let cat of signal.technical_catalysts" class="cat-chip">
            • {{ cat }}
          </span>
        </div>
      </div>

      <!-- Bottom Card Action -->
      <div class="card-footer">
        <div class="risk-info">
          <span class="risk-label">Risk Level:</span>
          <span class="risk-pill mono" [ngClass]="'risk-' + signal.risk_level.toLowerCase()">
            {{ signal.risk_level }}
          </span>
        </div>

        <div class="action-buttons">
          <button class="btn btn-secondary btn-sm" [routerLink]="['/stock', signal.symbol]">
            Forecast Graph
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <button class="btn btn-sm" [ngClass]="signal.action.includes('BUY') ? 'btn-buy' : 'btn-sell'" (click)="onTradeClick.emit(signal)">
            Quick {{ signal.action.includes('BUY') ? 'Buy' : 'Sell' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .morning-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .morning-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .border-buy {
      border-left: 4px solid var(--bullish);
    }
    .border-sell {
      border-left: 4px solid var(--bearish);
    }
    .border-hold {
      border-left: 4px solid var(--neutral);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .symbol-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .symbol-tag {
      font-size: 0.75rem;
      font-weight: 800;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 8px;
      border-radius: 4px;
      color: var(--text-primary);
      letter-spacing: 0.04em;
    }

    .time-stamp {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .asset-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .asset-name:hover {
      color: #00f2fe;
    }

    .signal-badge-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 6px currentColor;
    }

    .confidence-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #38bdf8;
    }

    .price-targets-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
    }

    .target-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .target-item .lbl {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .target-item .val {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .target-val {
      font-weight: 800;
    }

    .sl-val {
      color: #f43f5e;
    }

    .roi-val {
      font-weight: 800;
    }

    .rationale-box {
      background: rgba(0, 242, 254, 0.03);
      border: 1px solid rgba(0, 242, 254, 0.15);
      border-radius: var(--radius-sm);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rationale-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ai-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: #00f2fe;
      letter-spacing: 0.02em;
    }

    .rationale-text {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .catalysts-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .cat-chip {
      font-size: 0.6875rem;
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--border-color);
    }

    .risk-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
    }

    .risk-label {
      color: var(--text-muted);
    }

    .risk-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .risk-low { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .risk-medium { background: rgba(234, 179, 8, 0.15); color: #eab308; }
    .risk-high { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.75rem;
    }

    @media (max-width: 640px) {
      .price-targets-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .card-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .action-buttons {
        width: 100%;
      }
      .action-buttons .btn {
        flex: 1;
      }
    }
  `]
})
export class MorningSignalCardComponent {
  @Input({ required: true }) signal!: MorningSignal;
  @Output() onTradeClick = new EventEmitter<MorningSignal>();

  getBadgeClass(action: string): string {
    if (action.includes('STRONG BUY')) return 'badge-strong-buy';
    if (action.includes('BUY')) return 'badge-buy';
    if (action.includes('STRONG SELL')) return 'badge-strong-sell';
    if (action.includes('SELL')) return 'badge-sell';
    return 'badge-hold';
  }

  getCardBorderClass(action: string): string {
    if (action.includes('BUY')) return 'border-buy';
    if (action.includes('SELL')) return 'border-sell';
    return 'border-hold';
  }
}
