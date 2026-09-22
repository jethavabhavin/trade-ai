import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TradeApiService } from '../../services/trade-api.service';
import { StockSummary, StockDetail, MorningSignal, MarketDigest } from '../../models/trade.models';
import { MorningSignalCardComponent } from '../morning-signal-card/morning-signal-card.component';
import { TradingChartComponent } from '../trading-chart/trading-chart.component';
import { MultiAgentPanelComponent } from '../multi-agent-panel/multi-agent-panel.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MorningSignalCardComponent, TradingChartComponent, MultiAgentPanelComponent],
  template: `
    <div class="dashboard-page">
      <!-- 9:00 AM Pre-Market AI Daily Digest Hero Banner -->
      <section class="digest-banner glass-panel animate-pulse-glow" *ngIf="digest">
        <div class="digest-left">
          <div class="digest-header">
            <span class="badge badge-ai">
              <span class="live-dot"></span>
              9:00 AM PRE-MARKET AI INTELLIGENCE
            </span>
            <span class="digest-time mono">Generated Today @ {{ digest.generated_time }}</span>
          </div>

          <h1 class="digest-title">
            Pre-Market Outlook: <span class="gradient-text">{{ digest.market_sentiment }}</span>
          </h1>
          <p class="digest-summary">{{ digest.summary }}</p>

          <div class="digest-stats-row">
            <div class="d-stat">
              <span class="lbl">Pre-Market Signals</span>
              <span class="val mono">{{ digest.signals_count.total }} Generated</span>
            </div>
            <div class="d-stat">
              <span class="lbl">Buy Recommendations</span>
              <span class="val mono text-bullish">▲ {{ digest.signals_count.buy }} Assets</span>
            </div>
            <div class="d-stat">
              <span class="lbl">Sell / Take Profit</span>
              <span class="val mono text-bearish">▼ {{ digest.signals_count.sell }} Assets</span>
            </div>
            <div class="d-stat">
              <span class="lbl">Hold Corridor</span>
              <span class="val mono" style="color: #eab308;">■ {{ digest.signals_count.hold }} Assets</span>
            </div>
          </div>
        </div>

        <!-- Spotlight on Tata Steel ETF (User Ex) -->
        <div class="spotlight-card" [routerLink]="['/stock', 'TATASIL']" *ngIf="topSignal">
          <div class="spotlight-top">
            <span class="badge badge-strong-buy">TOP 9 AM BULLISH PICK</span>
            <span class="spot-conf mono">{{ topSignal.confidence }}% AI CONFIDENCE</span>
          </div>
          <div class="spotlight-body">
            <h2 class="spot-sym">TATASIL ETF</h2>
            <span class="spot-name">Tata Steel ETF / Index Fund</span>
            <div class="spot-price-row">
              <span class="spot-price mono">₹{{ topSignal.current_price | number:'1.2-2' }}</span>
              <span class="spot-target mono text-bullish">Target: ₹{{ topSignal.target_price }} (+{{ topSignal.expected_roi_pct }}%)</span>
            </div>
          </div>
          <div class="spotlight-footer">
            <span class="spot-cta">Explore 7-Day Forecast Graph →</span>
          </div>
        </div>
      </section>

      <!-- Featured Live Multi-Timeframe Chart (Tata Steel ETF Spotlight) -->
      <section class="featured-chart-section" *ngIf="featuredStock">
        <div class="section-title-bar">
          <div class="sec-left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <h2>Live Interactive Prediction Graph — {{ featuredStock.name }} ({{ featuredStock.symbol }})</h2>
          </div>
          <div class="sec-actions">
            <span class="badge badge-mini buy mono">9 AM CALL: {{ featuredStock.morning_signal?.action }}</span>
            <a [routerLink]="['/stock', featuredStock.symbol]" class="link-detail">Full Deep Dive & Trade →</a>
          </div>
        </div>

        <app-trading-chart
          [historicalData]="featuredStock.historical_data"
          [forecastPoints]="featuredStock.forecast_next_week"
          [currency]="featuredStock.currency"
          [currentRsi]="featuredStock.morning_signal?.rsi || 44.5"
        ></app-trading-chart>
      </section>

      <!-- Multi-Agent Orchestrator Intelligence Panel -->
      <section class="multi-agent-section">
        <app-multi-agent-panel [symbol]="featuredStock?.symbol || 'TATASIL'"></app-multi-agent-panel>
      </section>

      <!-- Section: 9:00 AM Morning AI Prediction Feed -->
      <section class="signals-section" id="morning-signals">
        <div class="section-title-bar">
          <div class="sec-left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <h2>Today's 9:00 AM Actionable Pre-Market Calls</h2>
          </div>
          <span class="sec-sub">Updated daily before Indian / Global market opening bell</span>
        </div>

        <div class="signals-grid">
          <app-morning-signal-card
            *ngFor="let sig of morningSignals"
            [signal]="sig"
            (onTradeClick)="onQuickTrade(sig)"
          ></app-morning-signal-card>
        </div>
      </section>

      <!-- Section: Market Overview & Filter Tabs -->
      <section class="market-overview-section glass-panel">
        <div class="table-header-row">
          <div class="filter-tabs">
            <button
              *ngFor="let cat of categories"
              class="tab-btn"
              [class.active]="selectedCategory === cat"
              (click)="filterCategory(cat)"
            >
              {{ cat }}
            </button>
          </div>

          <span class="assets-count mono">{{ filteredStocks.length }} Monitored Assets</span>
        </div>

        <div class="table-container">
          <table class="stocks-table">
            <thead>
              <tr>
                <th>Asset / Ticker</th>
                <th>Exchange</th>
                <th>Current Price</th>
                <th>24H Change</th>
                <th>24H Volume</th>
                <th>9:00 AM AI Call</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of filteredStocks" [routerLink]="['/stock', s.symbol]" class="clickable-row">
                <td>
                  <div class="sym-col">
                    <span class="sym-name mono">{{ s.symbol }}</span>
                    <span class="full-name">{{ s.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge-sub mono">{{ s.exchange }} • {{ s.category }}</span>
                </td>
                <td>
                  <span class="price-txt mono">{{ s.currency }}{{ s.current_price | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="change-tag mono" [class.bullish]="s.change_pct >= 0" [class.bearish]="s.change_pct < 0">
                    {{ s.change_pct >= 0 ? '+' : '' }}{{ s.change_pct }}%
                  </span>
                </td>
                <td>
                  <span class="vol-txt mono">{{ s.volume_24h }}</span>
                </td>
                <td>
                  <span *ngIf="s.morning_signal" class="badge" [ngClass]="getSignalBadge(s.morning_signal.action)">
                    {{ s.morning_signal.action }} ({{ s.morning_signal.confidence }}%)
                  </span>
                  <span *ngIf="!s.morning_signal" class="text-muted mono" style="font-size: 0.75rem;">
                    Neutral Hold
                  </span>
                </td>
                <td (click)="$event.stopPropagation()">
                  <button class="btn btn-secondary btn-xs" [routerLink]="['/stock', s.symbol]">
                    View 7D Graph
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 28px;
      padding-bottom: 40px;
    }

    /* Digest Hero Banner */
    .digest-banner {
      padding: 28px;
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: center;
      background: linear-gradient(135deg, rgba(15, 22, 36, 0.9) 0%, rgba(11, 25, 44, 0.95) 100%);
      border: 1px solid rgba(0, 242, 254, 0.2);
    }

    .digest-left {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .digest-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 6px #00f2fe;
    }

    .digest-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .digest-title {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .digest-summary {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .digest-stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 8px;
      padding-top: 14px;
      border-top: 1px solid var(--border-color);
    }

    .d-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .d-stat .lbl {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .d-stat .val {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Spotlight Card */
    .spotlight-card {
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(139, 92, 246, 0.12));
      border: 1px solid rgba(0, 242, 254, 0.35);
      border-radius: var(--radius-md);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .spotlight-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0, 242, 254, 0.2);
      border-color: #00f2fe;
    }

    .spotlight-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .spot-conf {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #00f2fe;
    }

    .spotlight-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .spot-sym {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .spot-name {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .spot-price-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 8px;
    }

    .spot-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .spot-target {
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .spotlight-footer {
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .spot-cta {
      font-size: 0.75rem;
      font-weight: 700;
      color: #00f2fe;
    }

    /* Signals Section */
    .signals-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title-bar {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sec-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sec-left h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .sec-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .signals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }

    /* Table Section */
    .market-overview-section {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .table-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .filter-tabs {
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;
    }

    .tab-btn {
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      border-radius: 6px;
      transition: all 0.15s ease;
    }
    .tab-btn.active {
      background: rgba(0, 242, 254, 0.15);
      color: #00f2fe;
    }

    .assets-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .table-container {
      overflow-x: auto;
    }

    .stocks-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .stocks-table th {
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

    .stocks-table td {
      padding: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .sym-col {
      display: flex;
      flex-direction: column;
    }

    .sym-name {
      font-weight: 800;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }

    .full-name {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .badge-sub {
      font-size: 0.6875rem;
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .price-txt {
      font-weight: 700;
      color: var(--text-primary);
    }

    .change-tag {
      font-weight: 700;
      font-size: 0.8125rem;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .change-tag.bullish {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
    }
    .change-tag.bearish {
      background: rgba(244, 63, 94, 0.12);
      color: #f43f5e;
    }

    .vol-txt {
      color: var(--text-secondary);
    }

    .featured-chart-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sec-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .link-detail {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #00f2fe;
      transition: color 0.15s ease;
    }
    .link-detail:hover {
      text-decoration: underline;
    }

    @media (max-width: 1024px) {
      .digest-banner {
        grid-template-columns: 1fr;
      }
      .digest-stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .signals-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stocks: StockSummary[] = [];
  filteredStocks: StockSummary[] = [];
  morningSignals: MorningSignal[] = [];
  digest: MarketDigest | null = null;
  topSignal: MorningSignal | null = null;
  featuredStock: StockDetail | null = null;

  categories: string[] = ['ALL', 'ETF', 'EQUITY', 'INDEX'];
  selectedCategory: string = 'ALL';

  constructor(private api: TradeApiService) {
    this.featuredStock = this.api.getFallbackStockDetail('TATASIL');
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getStockDetail('TATASIL').subscribe(detail => {
      if (detail) {
        this.featuredStock = detail;
      }
    });

    this.api.getStocks().subscribe(res => {
      this.stocks = res;
      this.filterCategory(this.selectedCategory);
    });

    this.api.getMorningSignals().subscribe(sigs => {
      this.morningSignals = sigs;
      this.topSignal = sigs.find(s => s.symbol === 'TATASIL') || sigs[0];
    });

    this.api.getMarketDigest().subscribe(d => {
      this.digest = d;
    });
  }

  filterCategory(cat: string): void {
    this.selectedCategory = cat;
    if (cat === 'ALL') {
      this.filteredStocks = this.stocks;
    } else {
      this.filteredStocks = this.stocks.filter(s => s.category.toUpperCase() === cat.toUpperCase());
    }
  }

  getSignalBadge(action: string): string {
    if (action.includes('STRONG BUY')) return 'badge-strong-buy';
    if (action.includes('BUY')) return 'badge-buy';
    if (action.includes('STRONG SELL')) return 'badge-strong-sell';
    if (action.includes('SELL')) return 'badge-sell';
    return 'badge-hold';
  }

  onQuickTrade(signal: MorningSignal): void {
    alert(`Pre-market simulated order initiated for ${signal.symbol} with target ₹${signal.target_price}`);
  }
}
