import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TradeApiService } from '../../services/trade-api.service';
import { PortfolioSummary, PortfolioPosition } from '../../models/trade.models';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="portfolio-page" *ngIf="portfolio">
      <!-- Portfolio Overview Cards -->
      <div class="metrics-grid">
        <div class="metric-card glass-panel">
          <span class="m-lbl">Total Current Value</span>
          <span class="m-val mono">₹{{ portfolio.total_current_value | number:'1.2-2' }}</span>
          <span class="m-sub mono">Portfolio Equity</span>
        </div>

        <div class="metric-card glass-panel">
          <span class="m-lbl">Total Invested</span>
          <span class="m-val mono">₹{{ portfolio.total_invested | number:'1.2-2' }}</span>
          <span class="m-sub mono">Initial Capital</span>
        </div>

        <div class="metric-card glass-panel">
          <span class="m-lbl">Unrealized Profit / Loss</span>
          <span class="m-val mono" [class.text-bullish]="portfolio.total_pnl >= 0" [class.text-bearish]="portfolio.total_pnl < 0">
            {{ portfolio.total_pnl >= 0 ? '+' : '' }}₹{{ portfolio.total_pnl | number:'1.2-2' }}
          </span>
          <span class="m-sub mono" [class.text-bullish]="portfolio.total_pnl_pct >= 0" [class.text-bearish]="portfolio.total_pnl_pct < 0">
            ({{ portfolio.total_pnl_pct >= 0 ? '+' : '' }}{{ portfolio.total_pnl_pct }}% All-Time ROI)
          </span>
        </div>
      </div>

      <!-- Positions Table -->
      <div class="positions-section glass-panel">
        <div class="sec-header">
          <h2>Active Paper Trading Positions ({{ portfolio.positions.length }})</h2>
          <span class="sec-sub">Simulate 9:00 AM AI Recommendations with zero financial risk</span>
        </div>

        <div class="table-responsive">
          <table class="pos-table">
            <thead>
              <tr>
                <th>Symbol / Asset</th>
                <th>Quantity</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Total Value</th>
                <th>Unrealized P&L</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pos of portfolio.positions" [routerLink]="['/stock', pos.symbol]" class="clickable-row">
                <td>
                  <div class="sym-col">
                    <span class="sym-txt mono">{{ pos.symbol }}</span>
                    <span class="name-txt">{{ pos.name }}</span>
                  </div>
                </td>
                <td class="mono font-bold">{{ pos.shares }} units</td>
                <td class="mono">₹{{ pos.average_buy_price | number:'1.2-2' }}</td>
                <td class="mono">₹{{ pos.current_price | number:'1.2-2' }}</td>
                <td class="mono font-bold">₹{{ pos.current_value | number:'1.2-2' }}</td>
                <td>
                  <div class="pnl-group">
                    <span class="mono font-bold" [class.text-bullish]="pos.unrealized_pnl >= 0" [class.text-bearish]="pos.unrealized_pnl < 0">
                      {{ pos.unrealized_pnl >= 0 ? '+' : '' }}₹{{ pos.unrealized_pnl | number:'1.2-2' }}
                    </span>
                    <span class="badge-mini" [class.buy]="pos.unrealized_pnl_pct >= 0" [class.sell]="pos.unrealized_pnl_pct < 0">
                      {{ pos.unrealized_pnl_pct >= 0 ? '+' : '' }}{{ pos.unrealized_pnl_pct }}%
                    </span>
                  </div>
                </td>
                <td (click)="$event.stopPropagation()">
                  <button class="btn btn-secondary btn-xs" [routerLink]="['/stock', pos.symbol]">
                    Forecast Graph
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portfolio-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .metric-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .m-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }

    .m-val {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .m-sub {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .positions-section {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sec-header h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .sec-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .pos-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .pos-table th {
      text-align: left;
      padding: 12px 14px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      text-transform: uppercase;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .clickable-row:hover {
      background: var(--bg-surface);
    }

    .pos-table td {
      padding: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .sym-col {
      display: flex;
      flex-direction: column;
    }

    .sym-txt {
      font-weight: 800;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }

    .name-txt {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .pnl-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-xs {
      padding: 4px 10px;
      font-size: 0.6875rem;
    }

    @media (max-width: 900px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PortfolioComponent implements OnInit {
  portfolio: PortfolioSummary | null = null;

  constructor(private api: TradeApiService) {}

  ngOnInit(): void {
    this.api.getPortfolio().subscribe(p => {
      this.portfolio = p;
    });
  }
}
