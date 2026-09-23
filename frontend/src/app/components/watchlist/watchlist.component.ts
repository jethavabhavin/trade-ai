import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TradeApiService } from '../../services/trade-api.service';
import { StockSummary, UserProfile } from '../../models/trade.models';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="watchlist-page">
      <div class="page-header glass-panel">
        <div class="header-left">
          <div class="title-row">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <h1>My AI Watchlist</h1>
          </div>
          <p class="subtitle">Monitored assets receiving automated 9:00 AM Pre-Market AI Calls every morning.</p>
        </div>

        <button class="btn btn-primary" (click)="openSearch()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Asset to Watchlist</span>
        </button>
      </div>

      <!-- Watchlist Grid Cards -->
      <div class="watchlist-grid">
        <div *ngFor="let s of watchlistedStocks" class="watch-card glass-panel" [routerLink]="['/stock', s.symbol]">
          <div class="card-top">
            <div class="sym-group">
              <span class="symbol-txt mono">{{ s.symbol }}</span>
              <span class="exchange-txt">{{ s.exchange }} • {{ s.category }}</span>
            </div>
            <button class="remove-btn" (click)="removeFromWatchlist(s.symbol, $event)" title="Remove from watchlist">
              ★
            </button>
          </div>

          <h3 class="name-txt">{{ s.name }}</h3>

          <div class="price-section">
            <span class="price-val mono">{{ s.currency }}{{ s.current_price | number:'1.2-2' }}</span>
            <span class="change-tag mono" [class.bullish]="s.change_pct >= 0" [class.bearish]="s.change_pct < 0">
              {{ s.change_pct >= 0 ? '+' : '' }}{{ s.change_pct }}%
            </span>
          </div>

          <!-- 9:00 AM Signal Banner -->
          <div class="signal-box" *ngIf="s.morning_signal">
            <div class="sig-header">
              <span class="badge-mini" [class.buy]="s.morning_signal.action.includes('BUY')" [class.sell]="s.morning_signal.action.includes('SELL')">
                9 AM: {{ s.morning_signal.action }}
              </span>
              <span class="conf-txt mono">{{ s.morning_signal.confidence }}% AI Conf.</span>
            </div>
            <p class="sig-target mono">Target: {{ s.currency }}{{ s.morning_signal.target_price }} ({{ s.morning_signal.expected_roi_pct > 0 ? '+' : '' }}{{ s.morning_signal.expected_roi_pct }}%)</p>
          </div>

          <div class="card-bottom">
            <span class="view-link">View 7-Day Forecast Curve →</span>
          </div>
        </div>
      </div>

      <div class="empty-state glass-panel" *ngIf="watchlistedStocks.length === 0">
        <h3>No assets in your watchlist yet.</h3>
        <p>Search any stock, ETF, or Index to add them to your watchlist.</p>
        <button class="btn btn-primary" (click)="openSearch()">Search Stocks</button>
      </div>
    </div>
  `,
  styles: [`
    .watchlist-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 40px;
    }

    .page-header {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-row h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .watchlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .watch-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .watch-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--border-highlight);
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sym-group {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .symbol-txt {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .exchange-txt {
      font-size: 0.6875rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .remove-btn {
      color: #f59e0b;
      font-size: 1.25rem;
      padding: 2px 6px;
    }

    .name-txt {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .price-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }

    .price-val {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .change-tag {
      font-weight: 700;
      font-size: 0.8125rem;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .change-tag.bullish {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .change-tag.bearish {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
    }

    .signal-box {
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sig-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .conf-txt {
      font-size: 0.6875rem;
      color: #38bdf8;
      font-weight: 700;
    }

    .sig-target {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .card-bottom {
      margin-top: auto;
      padding-top: 4px;
    }

    .view-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: #00f2fe;
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
  `]
})
export class WatchlistComponent implements OnInit {
  watchlistedStocks: StockSummary[] = [];
  user: UserProfile | null = null;

  constructor(private api: TradeApiService) {}

  ngOnInit(): void {
    this.loadWatchlist();
  }

  loadWatchlist(): void {
    this.api.currentUser$.subscribe(u => {
      this.user = u;
      this.api.getStocks().subscribe(all => {
        this.watchlistedStocks = all.filter(s => u.watchlist.includes(s.symbol));
      });
    });
  }

  removeFromWatchlist(symbol: string, event: MouseEvent): void {
    event.stopPropagation();
    this.api.toggleWatchlist(symbol).subscribe(() => {
      this.loadWatchlist();
    });
  }

  openSearch(): void {
    this.api.toggleSearchModal(true);
  }
}
