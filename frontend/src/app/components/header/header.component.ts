import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TradeApiService } from '../../services/trade-api.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { StockSummary, UserProfile } from '../../models/trade.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Top Live Ticker Tape -->
    <div class="ticker-bar">
      <div class="ticker-badge">
        <span class="live-dot"></span>
        <span class="ticker-title">9:00 AM PRE-MARKET AI</span>
      </div>
      <div class="ticker-scroll-track">
        <div class="ticker-items">
          <div *ngFor="let s of tickerStocks" class="ticker-item" [routerLink]="['/stock', s.symbol]">
            <span class="ticker-sym">{{ s.symbol }}</span>
            <span class="ticker-price">{{ s.currency }}{{ s.current_price | number:'1.2-2' }}</span>
            <span [class]="s.change_pct >= 0 ? 'text-bullish' : 'text-bearish'">
              {{ s.change_pct >= 0 ? '+' : '' }}{{ s.change_pct }}%
            </span>
            <span *ngIf="s.morning_signal" class="badge-mini" [ngClass]="getSignalClass(s.morning_signal.action)">
              {{ s.morning_signal.action }}
            </span>
          </div>
          <!-- Repeat for smooth infinite scroll -->
          <div *ngFor="let s of tickerStocks" class="ticker-item" [routerLink]="['/stock', s.symbol]">
            <span class="ticker-sym">{{ s.symbol }}</span>
            <span class="ticker-price">{{ s.currency }}{{ s.current_price | number:'1.2-2' }}</span>
            <span [class]="s.change_pct >= 0 ? 'text-bullish' : 'text-bearish'">
              {{ s.change_pct >= 0 ? '+' : '' }}{{ s.change_pct }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <header class="main-header glass-panel">
      <div class="header-left">
        <button class="mobile-toggle-btn" (click)="toggleMobileMenu.emit()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <a routerLink="/" class="logo-group">
          <div class="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div class="logo-text">
            <span class="brand-name">Trade<span class="gradient-text">AI</span></span>
            <span class="brand-tag">9 AM FORECAST</span>
          </div>
        </a>
      </div>

      <!-- Quick Search Trigger -->
      <div class="header-center">
        <div class="search-trigger" (click)="openSearch()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span class="search-placeholder">Search Tata Steel ETF (TATASIL), NIFTY, Stocks...</span>
          <kbd class="shortcut-key">Ctrl + K</kbd>
        </div>
      </div>

      <!-- Header Right: Theme Toggle, Admin link, Profile or Login Button -->
      <div class="header-right">
        <!-- Theme Mode Switch -->
        <button
          class="theme-toggle-btn"
          (click)="toggleTheme()"
          [title]="isDark ? 'Switch to Default Mode (Light)' : 'Switch to Night Mode (Dark)'"
        >
          <span *ngIf="isDark" class="theme-icon">🌙</span>
          <span *ngIf="!isDark" class="theme-icon">☀️</span>
          <span class="theme-label">{{ isDark ? 'Night Mode' : 'Default Mode' }}</span>
        </button>

        <!-- Admin Command Center Button (Visible only to Admin) -->
        <a 
          *ngIf="user && user.role === 'admin'" 
          routerLink="/admin" 
          class="admin-nav-pill" 
          title="Central Admin Command & RBAC"
        >
          <span class="admin-crown">👑</span>
          <span class="admin-text">Admin Panel</span>
        </a>

        <!-- Market Status Pill -->
        <div class="market-status-pill">
          <span class="pulse-indicator"></span>
          <span class="market-text">NEXT 9 AM RUN: <strong class="mono">08:45 AM</strong></span>
        </div>

        <button class="icon-btn alert-btn" title="9 AM Morning Predictions Active" routerLink="/#morning-signals">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notification-badge">9AM</span>
        </button>

        <!-- User Profile Pill when logged in -->
        <div class="user-auth-wrap" *ngIf="user; else loginButtonTpl">
          <a routerLink="/profile" class="user-pill" title="View Profile & Settings">
            <img [src]="user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'" alt="Avatar" class="avatar-img" />
            <div class="user-meta">
              <span class="user-name">{{ user.full_name }}</span>
              <span class="user-role mono" [class.admin-role]="user.role === 'admin'">
                {{ user.role === 'admin' ? '👑 ADMIN' : user.risk_tolerance }}
              </span>
            </div>
          </a>
          <button class="logout-mini-btn" (click)="logout()" title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        <!-- Login / Register Button if logged out -->
        <ng-template #loginButtonTpl>
          <button class="sign-in-btn" (click)="openLogin()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Sign In</span>
          </button>
        </ng-template>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .ticker-bar {
      background: #06090e;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      height: 32px;
      display: flex;
      align-items: center;
      overflow: hidden;
      font-size: 0.75rem;
    }

    .ticker-badge {
      background: rgba(0, 242, 254, 0.12);
      border-right: 1px solid rgba(0, 242, 254, 0.25);
      color: #00f2fe;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      font-weight: 700;
      white-space: nowrap;
      z-index: 2;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      background: #00f2fe;
      border-radius: 50%;
      box-shadow: 0 0 8px #00f2fe;
      animation: pulseGlow 1.5s infinite;
    }

    .ticker-scroll-track {
      display: flex;
      overflow: hidden;
      white-space: nowrap;
      width: 100%;
    }

    .ticker-items {
      display: flex;
      align-items: center;
      gap: 28px;
      animation: tickerLoop 30s linear infinite;
      padding-left: 20px;
    }

    @keyframes tickerLoop {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .ticker-item {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-family: var(--font-mono);
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .ticker-item:hover {
      color: var(--text-primary);
    }
    .ticker-sym {
      font-weight: 700;
      color: var(--text-primary);
    }
    .badge-mini {
      font-size: 0.65rem;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 800;
    }
    .badge-mini.buy { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .badge-mini.sell { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }
    .badge-mini.hold { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

    .main-header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .mobile-toggle-btn {
      display: none;
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius-sm);
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 70, 229, 0.2));
      border: 1px solid rgba(0, 242, 254, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00f2fe;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-tag {
      font-size: 0.6rem;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 1px;
    }

    .header-center {
      flex: 1;
      max-width: 480px;
      margin: 0 24px;
    }

    .search-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-subtle);
      padding: 8px 14px;
      border-radius: var(--radius-full);
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }
    .search-trigger:hover {
      border-color: var(--border-highlight);
      color: var(--text-primary);
    }
    .search-placeholder {
      font-size: 0.8125rem;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .shortcut-key {
      font-size: 0.65rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .admin-nav-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .admin-nav-pill:hover {
      background: rgba(245, 158, 11, 0.25);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
      transform: translateY(-1px);
    }

    .theme-toggle-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .theme-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--border-highlight);
    }

    .market-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-subtle);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
    }
    .pulse-indicator {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10b981;
      animation: pulseGlow 2s infinite;
    }
    .market-text {
      color: var(--text-secondary);
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .market-text strong {
      color: #00f2fe;
    }

    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
    }
    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      color: #06090e;
      font-size: 0.55rem;
      font-weight: 800;
      padding: 1px 4px;
      border-radius: 4px;
    }

    .user-auth-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      padding: 3px 12px 3px 4px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      transition: all 0.2s ease;
    }
    .user-pill:hover {
      border-color: var(--border-highlight);
    }

    .avatar-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid #00f2fe;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .user-role {
      font-size: 0.65rem;
      color: #00f2fe;
      text-transform: uppercase;
    }
    .user-role.admin-role {
      color: #fbbf24;
      font-weight: 800;
    }

    .logout-mini-btn {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      color: #fb7185;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .logout-mini-btn:hover {
      background: rgba(244, 63, 94, 0.25);
      border-color: #f43f5e;
      color: #fff;
    }

    .sign-in-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      border: none;
      color: #06090e;
      font-weight: 700;
      font-size: 0.85rem;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sign-in-btn:hover {
      box-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
      transform: translateY(-1px);
    }

    @media (max-width: 900px) {
      .header-center, .market-status-pill, .user-meta, .theme-label {
        display: none;
      }
      .mobile-toggle-btn {
        display: flex;
      }
      .main-header {
        padding: 0 16px;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Output() toggleMobileMenu = new EventEmitter<void>();

  tickerStocks: StockSummary[] = [];
  user: UserProfile | null = null;
  isDark: boolean = true;

  constructor(
    private api: TradeApiService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.api.getStocks().subscribe(stocks => {
      this.tickerStocks = stocks;
    });

    this.authService.currentUser$.subscribe(u => {
      this.user = u;
    });

    this.themeService.currentTheme$.subscribe(theme => {
      this.isDark = theme === 'dark';
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openSearch(): void {
    this.api.toggleSearchModal(true);
  }

  openLogin(): void {
    this.authService.openAuthModal('login');
  }

  logout(): void {
    this.authService.logout();
    this.authService.openAuthModal('login');
  }

  getSignalClass(action: string): string {
    if (action.includes('BUY')) return 'buy';
    if (action.includes('SELL')) return 'sell';
    return 'hold';
  }
}
