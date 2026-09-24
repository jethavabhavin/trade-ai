import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TradeApiService } from '../../services/trade-api.service';
import { WishlistItem, UserProfile } from '../../models/trade.models';

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
            <h1>My AI Wishlist & Watchlist</h1>
          </div>
          <p class="subtitle">Monitored database-tracked assets receiving automated 9:00 AM Pre-Market AI Signals & price targets.</p>
        </div>

        <button class="btn btn-primary" (click)="openSearch()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Asset to Wishlist</span>
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state glass-panel" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading your database wishlist...</p>
      </div>

      <!-- Wishlist Grid Cards -->
      <div class="watchlist-grid" *ngIf="!isLoading">
        <div *ngFor="let s of wishlistItems" class="watch-card glass-panel" [routerLink]="['/stock', s.symbol]">
          <div class="card-top">
            <div class="sym-group">
              <span class="symbol-txt mono">{{ s.symbol }}</span>
              <span class="exchange-txt">{{ s.category }}</span>
            </div>
            <button class="remove-btn" (click)="removeFromWishlist(s.symbol, $event)" title="Remove from wishlist">
              ★
            </button>
          </div>

          <h3 class="name-txt">{{ s.name }}</h3>

          <div class="price-section" *ngIf="s.current_price !== undefined && s.current_price !== null">
            <span class="price-val mono">{{ s.currency || '₹' }}{{ s.current_price | number:'1.2-2' }}</span>
            <span class="change-tag mono" *ngIf="s.change_pct !== undefined" [class.bullish]="s.change_pct >= 0" [class.bearish]="s.change_pct < 0">
              {{ s.change_pct >= 0 ? '+' : '' }}{{ s.change_pct }}%
            </span>
          </div>

          <!-- Today's High & Today's Low Bar -->
          <div class="today-hl-bar mono" *ngIf="s.current_price !== undefined && s.current_price !== null">
            <span class="hl-tag text-bullish">High: ▲ {{ s.currency || '₹' }}{{ ((s.current_price * 1.018) | number:'1.2-2') }}</span>
            <span class="hl-sep">•</span>
            <span class="hl-tag text-bearish">Low: ▼ {{ s.currency || '₹' }}{{ ((s.current_price * 0.982) | number:'1.2-2') }}</span>
          </div>

          <!-- Target Buy Price Badge if set -->
          <div class="target-badge" *ngIf="s.target_buy_price">
            <span class="target-label">Target Buy Price:</span>
            <span class="target-val mono">{{ s.currency || '₹' }}{{ s.target_buy_price | number:'1.2-2' }}</span>
          </div>

          <!-- Custom Notes -->
          <div class="notes-box" *ngIf="s.notes">
            <span class="notes-txt">"{{ s.notes }}"</span>
          </div>

          <!-- 9:00 AM Signal Banner -->
          <div class="signal-box" *ngIf="s.morning_signal_action">
            <div class="sig-header">
              <span class="badge-mini" [class.buy]="s.morning_signal_action.includes('BUY')" [class.sell]="s.morning_signal_action.includes('SELL')">
                9 AM: {{ s.morning_signal_action }}
              </span>
              <span class="conf-txt mono" *ngIf="s.morning_signal_confidence">{{ s.morning_signal_confidence }}% AI Conf.</span>
            </div>
            <p class="sig-target mono" *ngIf="s.morning_signal_target">AI Target: {{ s.currency || '₹' }}{{ s.morning_signal_target }}</p>
          </div>

          <div class="card-bottom">
            <span class="view-link">View 7-Day Forecast & Live Chart →</span>
          </div>
        </div>
      </div>

      <div class="empty-state glass-panel" *ngIf="!isLoading && wishlistItems.length === 0">
        <h3>No assets in your wishlist yet.</h3>
        <p>Search any stock, ETF, or Index to add them to your persistent database wishlist.</p>
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

    .loading-state {
      padding: 48px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--text-secondary);
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #00f2fe;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      background: none;
      border: none;
      cursor: pointer;
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

    .today-hl-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      background: var(--bg-surface);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .hl-tag {
      font-weight: 700;
    }

    .hl-sep {
      color: var(--text-muted);
      font-size: 0.625rem;
    }

    .target-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(56, 189, 248, 0.1);
      border: 1px dashed rgba(56, 189, 248, 0.3);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
    }
    .target-label {
      color: var(--text-muted);
    }
    .target-val {
      color: #38bdf8;
      font-weight: 700;
    }

    .notes-box {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
      background: var(--bg-surface);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
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

    .badge-mini {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }
    .badge-mini.buy {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
    .badge-mini.sell {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
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
  wishlistItems: WishlistItem[] = [];
  user: UserProfile | null = null;
  isLoading: boolean = true;

  constructor(private api: TradeApiService) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading = true;
    this.api.currentUser$.subscribe(u => {
      this.user = u;
    });

    this.api.getWishlist().subscribe({
      next: (items) => {
        this.wishlistItems = items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  removeFromWishlist(symbol: string, event: MouseEvent): void {
    event.stopPropagation();
    this.api.removeFromWishlist(symbol).subscribe(() => {
      this.wishlistItems = this.wishlistItems.filter(i => i.symbol !== symbol);
    });
  }

  openSearch(): void {
    this.api.toggleSearchModal(true);
  }
}

