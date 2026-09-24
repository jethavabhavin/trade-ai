import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TradeApiService } from '../../services/trade-api.service';
import { StockDetail, MorningSignal, UserProfile, PredictionComparisonResponse } from '../../models/trade.models';
import { TradingChartComponent } from '../trading-chart/trading-chart.component';
import { MorningSignalCardComponent } from '../morning-signal-card/morning-signal-card.component';
import { MultiAgentPanelComponent } from '../multi-agent-panel/multi-agent-panel.component';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TradingChartComponent,
    MorningSignalCardComponent,
    MultiAgentPanelComponent
  ],
  template: `
    <!-- Skeleton Full Page Loader -->
    <div class="stock-detail-page" *ngIf="isLoading">
      <div class="detail-header glass-panel">
        <div class="skeleton-shimmer skeleton-line lg w-1-3"></div>
        <div class="skeleton-shimmer skeleton-line xl w-1-4"></div>
      </div>
      <div class="content-grid" style="margin-top: 20px;">
        <div class="left-col">
          <div class="glass-panel loading-area-container" style="min-height: 460px;">
            <div class="spinner-ring"></div>
            <span class="loading-pulse-text">Fetching Live Candlesticks & Neural Forecast Curves...</span>
          </div>
        </div>
        <div class="right-col">
          <div class="skeleton-shimmer skeleton-card" style="height: 260px;"></div>
          <div class="skeleton-shimmer skeleton-card" style="height: 200px;"></div>
        </div>
      </div>
    </div>

    <div class="stock-detail-page" *ngIf="!isLoading && stock">
      <!-- Breadcrumb & Top Bar -->
      <div class="detail-header glass-panel">
        <div class="stock-identity">
          <div class="symbol-badge">
            <span class="symbol-text">{{ stock.symbol }}</span>
            <span class="exchange-tag">{{ stock.exchange }} : {{ stock.category }}</span>
          </div>
          <h1 class="stock-title">{{ stock.name }}</h1>
        </div>

        <div class="stock-price-block">
          <div class="price-row">
            <span class="main-price mono">{{ stock.currency }}{{ stock.current_price | number:'1.2-2' }}</span>
            <span class="change-pill" [class.bullish]="stock.change_pct >= 0" [class.bearish]="stock.change_pct < 0">
              {{ stock.change_pct >= 0 ? '▲ +' : '▼ ' }}{{ stock.change_amount }} ({{ stock.change_pct }}%)
            </span>
          </div>
          <div class="sub-metrics-row mono">
            <span class="sub-metric">Prev Close: <strong>{{ stock.currency }}{{ (stock.previous_close || (stock.current_price - stock.change_amount)) | number:'1.2-2' }}</strong></span>
            <span class="sub-sep">•</span>
            <span class="sub-metric">Today's Open: <strong>{{ stock.currency }}{{ (stock.today_open || stock.current_price) | number:'1.2-2' }}</strong></span>
            <span class="sub-sep">•</span>
            <span class="sub-metric high-pill">Today High: <strong class="text-bullish">▲ {{ stock.currency }}{{ (stock.day_high || (stock.current_price * 1.018)) | number:'1.2-2' }}</strong></span>
            <span class="sub-sep">•</span>
            <span class="sub-metric low-pill">Today Low: <strong class="text-bearish">▼ {{ stock.currency }}{{ (stock.day_low || (stock.current_price * 0.982)) | number:'1.2-2' }}</strong></span>
          </div>
          <span class="sub-label mono">Live Market Price • Updated Pre-Session</span>
        </div>

        <div class="top-actions">
          <a class="btn btn-secondary" [routerLink]="['/pine-script']" [queryParams]="{symbol: stock.symbol}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <span>Pine Script</span>
          </a>

          <button class="btn btn-secondary" (click)="toggleWatchlist()">
            <svg width="18" height="18" viewBox="0 0 24 24" [attr.fill]="isWatchlisted ? '#f59e0b' : 'none'" [attr.stroke]="isWatchlisted ? '#f59e0b' : 'currentColor'" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{{ isWatchlisted ? 'Watchlisted' : 'Add to Watchlist' }}</span>
          </button>

          <button class="btn btn-primary" (click)="showTradeModal = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Trade / Simulate</span>
          </button>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Left Column: Interactive Multi-Timeframe Chart + Forecast Table -->
        <div class="left-col">
          <!-- Main Interactive Chart with 1D, 1W, 1M, 1Y, 5Y, 1D & 7D Forecast + Prediction Comparison -->
          <app-trading-chart
            [historicalData]="stock.historical_data"
            [forecastPoints]="stock.forecast_next_week"
            [forecast1DPoints]="stock.forecast_1d || []"
            [currency]="stock.currency"
            [currentRsi]="stock.morning_signal?.rsi || 44.5"
            [symbol]="stock.symbol"
            [comparisonData]="comparisonData"
          ></app-trading-chart>

          <!-- TradeAI Multi-Agent Pipeline (TimesFM 3.0 + Gemini) -->
          <app-multi-agent-panel [symbol]="stock.symbol" [riskTolerance]="currentUser?.risk_tolerance || 'MODERATE'"></app-multi-agent-panel>

          <!-- Google TimesFM 3.0 Neural AI Analysis Card -->
          <div class="timesfm-panel glass-panel">
            <div class="timesfm-header">
              <div class="timesfm-title-group">
                <div class="timesfm-logo-chip">TimesFM 3.0</div>
                <div>
                  <h3 class="timesfm-heading">Google TimesFM 3.0 Neural Foundation Model</h3>
                  <span class="timesfm-sub">Multi-patch PyTorch zero-shot time series forecaster</span>
                </div>
              </div>

              <button class="btn btn-primary btn-sm" [disabled]="isRunningTimesFM" (click)="runTimesFMInference()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class.spin]="isRunningTimesFM">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>{{ isRunningTimesFM ? 'Running Neural Inference...' : '⚡ Re-Analyze with TimesFM 3.0' }}</span>
              </button>
            </div>

            <!-- TimesFM Neural Metric Grid -->
            <div class="timesfm-metrics-row" *ngIf="timesfmResult">
              <div class="tf-metric">
                <span class="tf-lbl">Inference Latency</span>
                <span class="tf-val mono text-cyan">{{ timesfmResult.inference_time_ms }} ms</span>
              </div>
              <div class="tf-metric">
                <span class="tf-lbl">Context Window</span>
                <span class="tf-val mono">{{ timesfmResult.context_length }} steps</span>
              </div>
              <div class="tf-metric">
                <span class="tf-lbl">10% Quantile (Support)</span>
                <span class="tf-val mono">{{ stock.currency }}{{ timesfmResult.quantiles_summary.q10_lower_bound | number:'1.2-2' }}</span>
              </div>
              <div class="tf-metric">
                <span class="tf-lbl">50% Point Forecast</span>
                <span class="tf-val mono text-bullish">{{ stock.currency }}{{ timesfmResult.quantiles_summary.q50_point_forecast | number:'1.2-2' }}</span>
              </div>
              <div class="tf-metric">
                <span class="tf-lbl">90% Quantile (Resistance)</span>
                <span class="tf-val mono">{{ stock.currency }}{{ timesfmResult.quantiles_summary.q90_upper_bound | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Neural Reasoning Summary -->
            <div class="timesfm-reasoning" *ngIf="timesfmResult">
              <span class="tf-reasoning-lbl">TimesFM 3.0 Attention Analysis:</span>
              <p class="tf-reasoning-txt">{{ timesfmResult.neural_reasoning }}</p>
            </div>
          </div>

          <!-- 7-Day AI Forecast Projections Table -->
          <div class="forecast-table-card glass-panel">
            <div class="card-title-row">
              <div class="title-with-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <h3>TimesFM 3.0 7-Day Forecast Trajectory Table</h3>
              </div>
              <span class="badge badge-ai">Quantile Horizon</span>
            </div>

            <div class="table-responsive">
              <table class="forecast-table">
                <thead>
                  <tr>
                    <th>Day / Date</th>
                    <th>Predicted Close</th>
                    <th>10% Support (Lower)</th>
                    <th>90% Resistance (Upper)</th>
                    <th>AI Confidence</th>
                    <th>Expected Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let fp of stock.forecast_next_week">
                    <td class="mono font-bold">{{ fp.day_name }}, {{ fp.date }}</td>
                    <td class="mono font-bold text-cyan">{{ stock.currency }}{{ fp.predicted_close | number:'1.2-2' }}</td>
                    <td class="mono text-muted">{{ stock.currency }}{{ fp.lower_bound | number:'1.2-2' }}</td>
                    <td class="mono text-muted">{{ stock.currency }}{{ fp.upper_bound | number:'1.2-2' }}</td>
                    <td>
                      <div class="conf-bar-wrapper">
                        <div class="conf-bar-fill" [style.width.%]="fp.confidence_pct"></div>
                        <span class="mono">{{ fp.confidence_pct }}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge-mini" [class.buy]="fp.trend === 'UP'" [class.sell]="fp.trend === 'DOWN'">
                        {{ fp.trend }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Key Fundamentals & Description -->
          <div class="stats-card glass-panel">
            <h3>Asset Description & Key Metrics</h3>
            <p class="desc-text">{{ stock.description }}</p>

            <div class="stats-grid">
              <div class="stat-box stat-highlight-bull">
                <span class="stat-lbl">Today's High</span>
                <span class="stat-val mono text-bullish">▲ {{ stock.currency }}{{ (stock.day_high || (stock.current_price * 1.018)) | number:'1.2-2' }}</span>
              </div>
              <div class="stat-box stat-highlight-bear">
                <span class="stat-lbl">Today's Low</span>
                <span class="stat-val mono text-bearish">▼ {{ stock.currency }}{{ (stock.day_low || (stock.current_price * 0.982)) | number:'1.2-2' }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">Today's Open</span>
                <span class="stat-val mono">{{ stock.currency }}{{ (stock.today_open || stock.current_price) | number:'1.2-2' }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">Previous Close</span>
                <span class="stat-val mono">{{ stock.currency }}{{ (stock.previous_close || (stock.current_price - stock.change_amount)) | number:'1.2-2' }}</span>
              </div>
              <div class="stat-box day-range-box">
                <span class="stat-lbl">Day's Range (Low — High)</span>
                <div class="range-meter">
                  <span class="range-edge mono text-bearish">{{ stock.currency }}{{ (stock.day_low || (stock.current_price * 0.982)) | number:'1.2-2' }}</span>
                  <div class="range-track">
                    <div class="range-thumb" [style.left.%]="getDayRangePosition(stock)" [title]="'Current: ' + stock.currency + (stock.current_price | number:'1.2-2')"></div>
                  </div>
                  <span class="range-edge mono text-bullish">{{ stock.currency }}{{ (stock.day_high || (stock.current_price * 1.018)) | number:'1.2-2' }}</span>
                </div>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">52-Week High</span>
                <span class="stat-val mono">{{ stock.currency }}{{ stock.week_high_52 | number:'1.2-2' }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">52-Week Low</span>
                <span class="stat-val mono">{{ stock.currency }}{{ stock.week_low_52 | number:'1.2-2' }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">24H Volume</span>
                <span class="stat-val mono">{{ stock.volume_24h }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-lbl">Market Cap / AUM</span>
                <span class="stat-val mono">{{ stock.market_cap }}</span>
              </div>
              <div class="stat-box" *ngIf="stock.pe_ratio">
                <span class="stat-lbl">P/E Ratio</span>
                <span class="stat-val mono">{{ stock.pe_ratio }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: 9:00 AM Morning AI Call & Technical Breakdown -->
        <div class="right-col">
          <!-- 9:00 AM Morning Signal Card -->
          <div class="section-label">
            <span class="pulse-dot"></span>
            <span>TODAY'S 9:00 AM PRE-MARKET SIGNAL</span>
          </div>

          <app-morning-signal-card
            *ngIf="stock.morning_signal"
            [signal]="stock.morning_signal"
            (onTradeClick)="openTradeWithSignal($event)"
          ></app-morning-signal-card>

          <!-- Technical Breakdown Meter -->
          <div class="technical-meter-card glass-panel" *ngIf="stock.morning_signal">
            <h3>Technical Indicators Breakdown</h3>
            
            <div class="tech-row">
              <span class="tech-name">RSI (14 Period)</span>
              <span class="tech-val mono" [class.text-bullish]="stock.morning_signal.rsi < 35" [class.text-bearish]="stock.morning_signal.rsi > 70">
                {{ stock.morning_signal.rsi }}
              </span>
            </div>
            <div class="progress-track">
              <div class="rsi-pointer" [style.left.%]="stock.morning_signal.rsi"></div>
              <div class="rsi-zones">
                <span class="zone-os">Oversold (&lt;30)</span>
                <span class="zone-neutral">Neutral (30-70)</span>
                <span class="zone-ob">Overbought (&gt;70)</span>
              </div>
            </div>

            <div class="tech-row" style="margin-top: 14px;">
              <span class="tech-name">MACD Indicator</span>
              <span class="badge-mini buy mono">{{ stock.morning_signal.macd_signal }}</span>
            </div>

            <div class="tech-row" style="margin-top: 10px;">
              <span class="tech-name">AI Market Sentiment</span>
              <span class="tech-val mono text-cyan">+{{ (stock.morning_signal.sentiment_score * 100) | number:'1.0-0' }}% Bullish</span>
            </div>
          </div>

          <!-- Spotlight on Selected Stock Advantages & Insights -->
          <div class="tatasil-special-card glass-panel" *ngIf="stock">
            <div class="special-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>{{ stock.name }} Special Drivers & Insights</span>
            </div>
            <p class="special-desc">
              {{ stock.description || (stock.name + ' is actively tracked by TradeAI neural transformers for technical breakouts, institutional volume flow, and multi-timeframe price discovery.') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Paper Trade Modal -->
      <div class="modal-backdrop" *ngIf="showTradeModal" (click)="showTradeModal = false">
        <div class="trade-modal glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Execute Paper Trade - {{ stock.symbol }}</h3>
            <button class="close-btn" (click)="showTradeModal = false">✕</button>
          </div>

          <div class="trade-modal-body">
            <div class="modal-price-display">
              <span class="lbl">Current Market Price:</span>
              <span class="val mono">{{ stock.currency }}{{ stock.current_price | number:'1.2-2' }}</span>
            </div>

            <div class="form-group">
              <label>Trade Action</label>
              <div class="action-toggle-group">
                <button
                  type="button"
                  class="action-btn"
                  [class.active-buy]="tradeAction === 'BUY'"
                  (click)="tradeAction = 'BUY'"
                >
                  BUY
                </button>
                <button
                  type="button"
                  class="action-btn"
                  [class.active-sell]="tradeAction === 'SELL'"
                  (click)="tradeAction = 'SELL'"
                >
                  SELL
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Number of Shares / Units</label>
              <input
                type="number"
                class="form-input mono"
                [(ngModel)]="tradeShares"
                min="1"
                step="1"
              />
            </div>

            <div class="order-summary-box">
              <div class="sum-row">
                <span>Estimated Total:</span>
                <span class="mono font-bold">{{ stock.currency }}{{ (tradeShares * stock.current_price) | number:'1.2-2' }}</span>
              </div>
              <div class="sum-row text-muted" *ngIf="stock.morning_signal">
                <span>Suggested 9 AM Target:</span>
                <span class="mono">{{ stock.currency }}{{ stock.morning_signal.target_price }}</span>
              </div>
            </div>

            <button
              class="btn btn-block"
              [ngClass]="tradeAction === 'BUY' ? 'btn-buy' : 'btn-sell'"
              (click)="executeTrade()"
            >
              Confirm {{ tradeAction }} Order
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stock-detail-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-bottom: 40px;
    }

    .detail-header {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
    }

    .symbol-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }

    .symbol-text {
      font-size: 1rem;
      font-weight: 800;
      color: #00f2fe;
      background: rgba(0, 242, 254, 0.12);
      padding: 2px 10px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .exchange-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 700;
    }

    .stock-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .stock-price-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .main-price {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .change-pill {
      font-size: 0.875rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-full);
    }
    .change-pill.bullish {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .change-pill.bearish {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
    }

    .sub-label {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 20px;
    }

    .left-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .right-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      font-weight: 800;
      color: #00f2fe;
      letter-spacing: 0.06em;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #00f2fe;
      border-radius: 50%;
      box-shadow: 0 0 8px #00f2fe;
    }

    .forecast-table-card, .stats-card, .technical-meter-card, .tatasil-special-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-with-icon h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .forecast-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .forecast-table th {
      text-align: left;
      padding: 10px 12px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      text-transform: uppercase;
    }

    .forecast-table td {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .conf-bar-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .conf-bar-fill {
      height: 6px;
      background: linear-gradient(90deg, #38bdf8, #8b5cf6);
      border-radius: 3px;
      min-width: 40px;
    }

    .high-pill {
      background: rgba(16, 185, 129, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .low-pill {
      background: rgba(244, 63, 94, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid rgba(244, 63, 94, 0.25);
    }

    .desc-text {
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-box.stat-highlight-bull {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
      border-color: rgba(16, 185, 129, 0.35);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.1);
    }

    .stat-box.stat-highlight-bear {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(244, 63, 94, 0.02));
      border-color: rgba(244, 63, 94, 0.35);
      box-shadow: 0 0 12px rgba(244, 63, 94, 0.1);
    }

    .stat-box.day-range-box {
      grid-column: span 2;
    }

    .range-meter {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }

    .range-edge {
      font-size: 0.8125rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .range-track {
      flex: 1;
      height: 8px;
      background: linear-gradient(90deg, rgba(244, 63, 94, 0.6) 0%, rgba(234, 179, 8, 0.6) 50%, rgba(16, 185, 129, 0.6) 100%);
      border-radius: 4px;
      position: relative;
    }

    .range-thumb {
      position: absolute;
      top: -4px;
      width: 16px;
      height: 16px;
      background: #00f2fe;
      border: 2px solid #ffffff;
      border-radius: 50%;
      transform: translateX(-50%);
      box-shadow: 0 0 8px #00f2fe;
      cursor: pointer;
    }

    .stat-lbl {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .stat-val {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .tech-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8125rem;
    }
    .tech-name {
      color: var(--text-secondary);
      font-weight: 600;
    }

    .progress-track {
      height: 8px;
      background: linear-gradient(90deg, #10b981 0%, #eab308 50%, #f43f5e 100%);
      border-radius: 4px;
      position: relative;
      margin: 8px 0 20px 0;
    }

    .rsi-pointer {
      position: absolute;
      top: -4px;
      width: 16px;
      height: 16px;
      background: #ffffff;
      border: 2px solid #080c14;
      border-radius: 50%;
      transform: translateX(-50%);
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
    }

    .rsi-zones {
      display: flex;
      justify-content: space-between;
      font-size: 0.625rem;
      color: var(--text-muted);
      margin-top: 14px;
    }

    .tatasil-special-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(0, 242, 254, 0.04));
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .special-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 800;
      color: #f59e0b;
    }
    .special-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Paper Trade Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .trade-modal {
      width: 100%;
      max-width: 440px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: var(--bg-card);
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
    }

    .close-btn {
      color: var(--text-muted);
      font-size: 1.25rem;
    }

    .trade-modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-price-display {
      display: flex;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .action-toggle-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .action-btn {
      padding: 10px;
      font-weight: 700;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .action-btn.active-buy {
      background: var(--bullish);
      color: #080c14;
      border-color: var(--bullish);
    }
    .action-btn.active-sell {
      background: var(--bearish);
      color: #ffffff;
      border-color: var(--bearish);
    }

    .form-input {
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 1rem;
    }

    .order-summary-box {
      background: var(--bg-surface);
      padding: 12px;
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.875rem;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
    }

    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 0.9375rem;
    }

    /* TimesFM 3.0 Panel Styles */
    .timesfm-panel {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.06) 0%, rgba(139, 92, 246, 0.08) 100%);
      border: 1px solid rgba(0, 242, 254, 0.3);
      position: relative;
    }

    .timesfm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .timesfm-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .timesfm-logo-chip {
      background: linear-gradient(135deg, #00f2fe, #8b5cf6);
      color: #080c14;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.4);
    }

    .timesfm-heading {
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .timesfm-sub {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .timesfm-metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px;
    }

    .tf-metric {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .tf-lbl {
      font-size: 0.6875rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
    }

    .tf-val {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .timesfm-reasoning {
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      border-left: 3px solid #38bdf8;
    }

    .tf-reasoning-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: #38bdf8;
      display: block;
      margin-bottom: 4px;
    }

    .tf-reasoning-txt {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .stat-box.day-range-box {
        grid-column: span 1;
      }
    }
  `]
})
export class StockDetailComponent implements OnInit {
  stock: StockDetail | null = null;
  isLoading: boolean = true;
  isWatchlisted: boolean = false;
  showTradeModal: boolean = false;
  tradeAction: 'BUY' | 'SELL' = 'BUY';
  tradeShares: number = 10;
  timesfmResult: any = null;
  isRunningTimesFM: boolean = false;
  currentUser: UserProfile | null = null;
  comparisonData: PredictionComparisonResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: TradeApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.currentUser$.subscribe(u => {
      this.currentUser = u;
      this.cdr.markForCheck();
    });

    this.route.paramMap.subscribe(params => {
      const sym = params.get('symbol') || 'TATASIL';
      this.loadStock(sym);
      this.loadTimesFMPrediction(sym);
      this.loadPredictionComparison(sym);
    });
  }

  getDayRangePosition(stock: StockDetail | null): number {
    if (!stock) return 50;
    const high = stock.day_high || (stock.current_price * 1.018);
    const low = stock.day_low || (stock.current_price * 0.982);
    if (high <= low) return 50;
    const pos = ((stock.current_price - low) / (high - low)) * 100;
    return Math.max(2, Math.min(98, Math.round(pos)));
  }

  loadPredictionComparison(symbol: string): void {
    this.api.getPredictionComparison(symbol).subscribe(res => {
      this.comparisonData = res;
      this.cdr.markForCheck();
    });
  }

  loadStock(symbol: string): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.api.getStockDetail(symbol).subscribe({
      next: (detail) => {
        this.stock = detail || this.api.getFallbackStockDetail(symbol);
        this.isLoading = false;
        this.api.currentUser$.subscribe(u => {
          if (u && u.watchlist) {
            this.isWatchlisted = u.watchlist.includes(symbol.toUpperCase());
          }
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.stock = this.api.getFallbackStockDetail(symbol);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTimesFMPrediction(symbol: string): void {
    this.api.getTimesFMPrediction(symbol).subscribe(res => {
      this.timesfmResult = res;
      if (this.stock && res.forecast_points && res.forecast_points.length > 0) {
        this.stock.forecast_next_week = res.forecast_points;
      }
      this.cdr.markForCheck();
    });
  }

  runTimesFMInference(): void {
    if (!this.stock) return;
    this.isRunningTimesFM = true;
    this.cdr.markForCheck();
    this.api.getTimesFMPrediction(this.stock.symbol).subscribe({
      next: (res) => {
        this.timesfmResult = res;
        if (this.stock && res.forecast_points) {
          this.stock.forecast_next_week = res.forecast_points;
        }
        setTimeout(() => {
          this.isRunningTimesFM = false;
          this.cdr.markForCheck();
        }, 400);
      },
      error: () => {
        this.isRunningTimesFM = false;
        this.cdr.markForCheck();
      }
    });
  }

  toggleWatchlist(): void {
    if (!this.stock) return;
    this.api.toggleWatchlist(this.stock.symbol).subscribe(() => {
      this.isWatchlisted = !this.isWatchlisted;
    });
  }

  openTradeWithSignal(signal: MorningSignal): void {
    this.tradeAction = signal.action.includes('SELL') ? 'SELL' : 'BUY';
    this.showTradeModal = true;
  }

  executeTrade(): void {
    if (!this.stock) return;
    this.api.executeTrade(this.stock.symbol, this.tradeShares, this.tradeAction).subscribe(() => {
      this.showTradeModal = false;
      alert(`Successfully simulated ${this.tradeAction} of ${this.tradeShares} shares of ${this.stock?.symbol}!`);
    });
  }
}

