import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError, takeUntil } from 'rxjs/operators';
import { TradeApiService } from '../../services/trade-api.service';
import { StockSummary } from '../../models/trade.models';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="search-backdrop" *ngIf="isOpen" (click)="close()">
      <div class="search-dialog glass-panel" (click)="$event.stopPropagation()">
        <!-- Search Input Bar -->
        <div class="search-input-header">
          <div class="search-icon-box">
            <svg *ngIf="!isSearching" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div *ngIf="isSearching" class="search-spinner" title="Searching live markets..."></div>
          </div>
          <input
            #searchInput
            type="text"
            class="main-search-input"
            placeholder="Search any stock, ETF, or Index (e.g. NIFTY 50, Reliance, Apple, Tata Steel, IONQ)..."
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            (keydown.escape)="close()"
            autofocus
          />
          <button class="clear-btn" *ngIf="searchQuery" (click)="clearSearch()">✕</button>
          <kbd class="esc-badge" (click)="close()">ESC</kbd>
        </div>

        <!-- Quick Tags -->
        <div class="quick-tags-row">
          <span class="tag-title">Trending:</span>
          <button class="quick-tag-chip" (click)="setQuery('NIFTY50')">⚡ NIFTY 50</button>
          <button class="quick-tag-chip" (click)="setQuery('RELIANCE')">Reliance</button>
          <button class="quick-tag-chip" (click)="setQuery('TCS')">TCS</button>
          <button class="quick-tag-chip" (click)="setQuery('GOLDBEES')">Gold ETF</button>
          <button class="quick-tag-chip" (click)="setQuery('TATSILV')">Tata Silver</button>
        </div>

        <!-- Search Results List -->
        <div class="search-results-list">
          <div *ngIf="isSearching && results.length === 0" class="searching-state">
            <div class="searching-pulse"></div>
            <p>Searching live market assets & exchanges...</p>
          </div>

          <div *ngIf="!isSearching && results.length === 0" class="no-results">
            <p>No matching stocks or ETFs found for "{{ searchQuery }}".</p>
          </div>

          <div
            *ngFor="let s of results"
            class="result-item"
            (click)="selectStock(s.symbol)"
          >
            <div class="res-left">
              <div class="res-sym-row">
                <span class="res-sym mono">{{ s.symbol }}</span>
                <span class="res-badge mono">{{ s.category }}</span>
              </div>
              <span class="res-name">{{ s.name }}</span>
            </div>

            <div class="res-right">
              <span class="res-price mono">{{ s.currency }}{{ s.current_price | number:'1.2-2' }}</span>
              <span class="res-change mono" [class.text-bullish]="s.change_pct >= 0" [class.text-bearish]="s.change_pct < 0">
                {{ s.change_pct >= 0 ? '+' : '' }}{{ s.change_pct }}%
              </span>
              <span *ngIf="s.morning_signal" class="badge-mini-sig mono" [class.buy]="s.morning_signal.action.includes('BUY')">
                {{ s.morning_signal.action }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(4, 7, 12, 0.8);
      backdrop-filter: blur(12px);
      z-index: 3000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 80px 16px 20px 16px;
    }

    .search-dialog {
      width: 100%;
      max-width: 620px;
      background: #0d1422;
      border: 1px solid rgba(0, 242, 254, 0.3);
      border-radius: var(--radius-md);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .search-input-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      background: #111a2d;
    }

    .search-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .search-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(0, 242, 254, 0.2);
      border-top-color: #00f2fe;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .main-search-input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 1.0625rem;
      font-family: var(--font-main);
      outline: none;
    }
    .main-search-input::placeholder {
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    .clear-btn {
      color: var(--text-muted);
      font-size: 0.875rem;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .clear-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }

    .esc-badge {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 3px 8px;
      border-radius: 4px;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .quick-tags-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .tag-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      white-space: nowrap;
    }

    .quick-tag-chip {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      background: var(--bg-surface);
      color: var(--text-secondary);
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      white-space: nowrap;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .quick-tag-chip:hover {
      border-color: #00f2fe;
      color: #00f2fe;
      background: rgba(0, 242, 254, 0.08);
    }

    .search-results-list {
      max-height: 380px;
      overflow-y: auto;
      padding: 8px;
    }

    .searching-state {
      padding: 32px;
      text-align: center;
      color: #00f2fe;
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .searching-pulse {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0, 242, 254, 0.2);
      border: 2px solid #00f2fe;
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(0.9); opacity: 0.6; }
      50% { transform: scale(1.15); opacity: 1; }
    }

    .no-results {
      padding: 32px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .result-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .result-item:hover {
      background: var(--bg-surface);
    }

    .res-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .res-sym-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .res-sym {
      font-weight: 800;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .res-badge {
      font-size: 0.625rem;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
    }

    .res-name {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .res-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .res-price {
      font-weight: 700;
      font-size: 0.9375rem;
    }

    .res-change {
      font-size: 0.75rem;
      font-weight: 700;
    }

    .badge-mini-sig {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(234, 179, 8, 0.15);
      color: #eab308;
    }
    .badge-mini-sig.buy {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
  `]
})
export class SearchModalComponent implements OnInit, OnDestroy {
  isOpen: boolean = false;
  searchQuery: string = '';
  results: StockSummary[] = [];
  isSearching: boolean = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private api: TradeApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.searchModalOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(open => {
        this.isOpen = open;
        if (open) {
          // Immediately trigger initial load when modal opens
          this.searchSubject.next(this.searchQuery);
        }
        this.cdr.markForCheck();
      });

    // RxJS Debounce Pipeline (300ms debounce + distinctUntilChanged + switchMap)
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.isSearching = true;
          this.cdr.markForCheck();
        }),
        switchMap(query => {
          const trimmed = (query || '').trim();
          if (!trimmed) {
            return this.api.getStocks().pipe(
              catchError(() => of([] as StockSummary[]))
            );
          }
          return this.api.searchStocks(trimmed).pipe(
            catchError(() => of([] as StockSummary[]))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: res => {
          this.results = res || [];
          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSearching = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.api.toggleSearchModal(true);
    }
  }

  close(): void {
    this.api.toggleSearchModal(false);
  }

  setQuery(q: string): void {
    this.searchQuery = q;
    this.searchSubject.next(q);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  selectStock(symbol: string): void {
    this.close();
    this.router.navigate(['/stock', symbol]);
  }
}
