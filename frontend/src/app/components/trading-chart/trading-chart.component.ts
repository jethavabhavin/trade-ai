import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricePoint, ForecastPoint, PredictionComparisonResponse, ComparisonBarPoint } from '../../models/trade.models';

@Component({
  selector: 'app-trading-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrapper glass-panel">
      <!-- Chart Controls Header -->
      <div class="chart-header">
        <div class="timeframe-group">
          <button
            *ngFor="let tf of timeframes"
            class="tf-btn"
            [class.active]="selectedTimeframe === tf"
            (click)="selectTimeframe(tf)"
          >
            {{ tf }}
          </button>
        </div>

        <div class="header-actions">
          <!-- Horizon Selector Pills (1-Day Intraday vs 7-Day Multi-Day) -->
          <div class="horizon-switch-group" *ngIf="showForecast && !showComparison">
            <button
              class="horizon-switch-btn"
              [class.active]="forecastHorizon === '1D'"
              (click)="setForecastHorizon('1D')"
              title="1-Day Future Intraday Prediction (Hourly Curve)"
            >
              1D Future
            </button>
            <button
              class="horizon-switch-btn"
              [class.active]="forecastHorizon === '7D'"
              (click)="setForecastHorizon('7D')"
              title="7-Day Future Next Week Prediction"
            >
              7D Future
            </button>
          </div>

          <!-- Toggle Future AI Forecast Overlay -->
          <button
            class="toggle-forecast-btn"
            [class.active]="showForecast && !showComparison"
            (click)="toggleForecast()"
            title="Toggle Future AI Projection Curve"
          >
            <div class="ai-spark-dot"></div>
            <span>{{ forecastHorizon === '1D' ? '1-Day Future Forecast' : '7-Day Future Forecast' }}</span>
            <span class="badge-mini-ai">{{ forecastHorizon }}</span>
          </button>

          <!-- Toggle Past Prediction vs Current Graph Comparison Overlay -->
          <button
            class="toggle-compare-btn"
            [class.active]="showComparison"
            (click)="toggleComparison()"
            title="Compare Last AI Prediction with Realized Graph Price Data"
          >
            <div class="compare-amber-dot"></div>
            <span>Compare Last Prediction</span>
            <span class="badge-mini-acc" *ngIf="comparisonData">
              {{ comparisonData.directional_accuracy_pct | number:'1.1-1' }}% Match
            </span>
          </button>

          <!-- Chart Type Selector -->
          <div class="type-selector">
            <button
              class="type-btn"
              [class.active]="chartType === 'area'"
              (click)="chartType = 'area'; renderChart()"
              title="Area Line Chart"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </button>
            <button
              class="type-btn"
              [class.active]="chartType === 'candles'"
              (click)="chartType = 'candles'; renderChart()"
              title="Candlestick Chart"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="6" width="4" height="12" rx="1"/>
                <line x1="6" y1="2" x2="6" y2="6"/>
                <line x1="6" y1="18" x2="6" y2="22"/>
                <rect x="14" y="3" width="4" height="15" rx="1"/>
                <line x1="16" y1="1" x2="16" y2="3"/>
                <line x1="16" y1="18" x2="16" y2="23"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Comparison Accuracy HUD Banner (Active when Compare is ON) -->
      <div class="comparison-hud-banner" *ngIf="showComparison && comparisonData">
        <div class="hud-item main-call">
          <span class="hud-lbl">PAST PREDICTION CALL</span>
          <div class="hud-val-row">
            <span class="badge-signal-pill mono" [class.buy]="comparisonData.action.includes('BUY')" [class.sell]="comparisonData.action.includes('SELL')">
              {{ comparisonData.action }}
            </span>
            <span class="mono text-muted">@ {{ currency }}{{ comparisonData.predicted_base_price | number:'1.2-2' }}</span>
          </div>
          <span class="hud-sub mono">Issued: {{ comparisonData.predicted_at }}</span>
        </div>

        <div class="hud-item">
          <span class="hud-lbl">TARGET vs CURRENT PRICE</span>
          <div class="hud-val-row mono">
            <span class="text-bullish">🎯 {{ currency }}{{ comparisonData.target_price | number:'1.2-2' }}</span>
            <span class="hud-sep">➔</span>
            <span class="text-white">Actual: {{ currency }}{{ comparisonData.current_market_price | number:'1.2-2' }}</span>
          </div>
          <span class="hud-sub mono" [class.text-bullish]="comparisonData.price_delta_pct >= 0" [class.text-bearish]="comparisonData.price_delta_pct < 0">
            Realized Delta: {{ comparisonData.price_delta_pct >= 0 ? '+' : '' }}{{ comparisonData.price_delta_pct }}% ({{ currency }}{{ comparisonData.price_delta }})
          </span>
        </div>

        <div class="hud-item">
          <span class="hud-lbl">DIRECTIONAL ACCURACY</span>
          <div class="hud-val-row">
            <span class="accuracy-score mono">{{ comparisonData.directional_accuracy_pct | number:'1.2-2' }}%</span>
            <span class="hud-status-pill mono" [class.hit]="comparisonData.target_hit" [class.tracking]="comparisonData.status === 'ACCURATE_TRACKING' || comparisonData.status === 'ON_TRACK'">
              {{ comparisonData.target_hit ? 'TARGET HIT 🎯' : comparisonData.status }}
            </span>
          </div>
          <span class="hud-sub">Quantile Confidence: {{ comparisonData.confidence_score }}%</span>
        </div>

        <div class="hud-item right-toggle">
          <button class="btn-matrix-toggle" (click)="showMatrix = !showMatrix">
            <span>{{ showMatrix ? 'Hide Bar Matrix' : 'View Bar Variance Matrix' }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline [attr.points]="showMatrix ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Live Hover Detail Bar -->
      <div class="chart-meta-bar" *ngIf="hoveredPoint || latestPoint">
        <div class="meta-item">
          <span class="meta-lbl">TIME / BAR:</span>
          <span class="meta-val mono">{{ hoveredPoint?.time_label || latestPoint?.time_label }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">ACTUAL CLOSE:</span>
          <span class="meta-val mono" [class.text-bullish]="isBullish" [class.text-bearish]="!isBullish">
            {{ currency }}{{ (hoveredPoint?.close || latestPoint?.close) | number:'1.2-2' }}
          </span>
        </div>
        <div class="meta-item" *ngIf="chartType === 'candles'">
          <span class="meta-lbl">O:</span>
          <span class="meta-val mono">{{ currency }}{{ (hoveredPoint?.open || latestPoint?.open) | number:'1.2-2' }}</span>
          <span class="meta-lbl">H:</span>
          <span class="meta-val mono">{{ currency }}{{ (hoveredPoint?.high || latestPoint?.high) | number:'1.2-2' }}</span>
          <span class="meta-lbl">L:</span>
          <span class="meta-val mono">{{ currency }}{{ (hoveredPoint?.low || latestPoint?.low) | number:'1.2-2' }}</span>
        </div>
        <div class="meta-item" *ngIf="hoveredPoint?.volume || latestPoint?.volume">
          <span class="meta-lbl">VOL:</span>
          <span class="meta-val mono">{{ (hoveredPoint?.volume || latestPoint?.volume) | number }}</span>
        </div>

        <!-- Comparison Hover Callout -->
        <div class="meta-item compare-hover-pill" *ngIf="showComparison && hoveredComparePoint">
          <span class="compare-amber-dot"></span>
          <span class="meta-lbl">PAST PREDICTED:</span>
          <span class="meta-val mono text-amber">{{ currency }}{{ hoveredComparePoint.predicted_close | number:'1.2-2' }}</span>
          <span class="meta-conf mono" [class.text-bullish]="hoveredComparePoint.variance_pct >= 0" [class.text-bearish]="hoveredComparePoint.variance_pct < 0">
            (Var: {{ hoveredComparePoint.variance_pct >= 0 ? '+' : '' }}{{ hoveredComparePoint.variance_pct }}% • {{ hoveredComparePoint.within_confidence_band ? 'In Band ✅' : 'Out Band ⚠️' }})
          </span>
        </div>

        <!-- Future AI Forecast Hover Callout -->
        <div class="meta-item ai-hover-pill" *ngIf="!showComparison && hoveredForecast">
          <span class="ai-pill-dot"></span>
          <span class="meta-lbl">FUTURE PREDICTED:</span>
          <span class="meta-val mono text-cyan">{{ currency }}{{ hoveredForecast.predicted_close | number:'1.2-2' }}</span>
          <span class="meta-conf mono">({{ hoveredForecast.confidence_pct }}% Conf.)</span>
        </div>
      </div>

      <!-- Main SVG Chart Canvas -->
      <div class="svg-container" #svgContainer (mousemove)="onMouseMove($event)" (mouseleave)="onMouseLeave()">
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="main-svg" preserveAspectRatio="none">
          <defs>
            <!-- Historical Area Gradients -->
            <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
            </linearGradient>

            <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.0" />
            </linearGradient>

            <!-- Future Forecast Cloud Area Gradient -->
            <linearGradient id="forecastCloudGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05" />
            </linearGradient>

            <!-- Past Prediction Comparison Cloud Gradient -->
            <linearGradient id="compareCloudGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02" />
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines & Price Labels -->
          <g class="grid-lines">
            <ng-container *ngFor="let gl of gridLines">
              <line
                x1="0"
                [attr.y1]="gl.y"
                [attr.x2]="width"
                [attr.y2]="gl.y"
                stroke="rgba(255, 255, 255, 0.06)"
                stroke-dasharray="4,4"
              />
              <text
                [attr.x]="width - 10"
                [attr.y]="gl.y - 4"
                text-anchor="end"
                fill="rgba(148, 163, 184, 0.6)"
                font-size="10"
                font-family="JetBrains Mono"
              >
                {{ currency }}{{ gl.price | number:'1.2-2' }}
              </text>
            </ng-container>
          </g>

          <!-- ========================================================= -->
          <!-- PAST PREDICTION COMPARISON OVERLAY (When showComparison) -->
          <!-- ========================================================= -->
          <g *ngIf="showComparison && comparisonData">
            <!-- Target Price Reference Line -->
            <line
              x1="0"
              [attr.y1]="targetPriceY"
              [attr.x2]="width"
              [attr.y2]="targetPriceY"
              stroke="#10b981"
              stroke-dasharray="5,3"
              stroke-width="1.5"
              opacity="0.8"
            />
            <rect
              x="12"
              [attr.y]="targetPriceY - 18"
              width="145"
              height="16"
              rx="3"
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10b981"
              stroke-width="1"
            />
            <text
              x="18"
              [attr.y]="targetPriceY - 6"
              fill="#10b981"
              font-size="9.5"
              font-weight="700"
              font-family="JetBrains Mono"
            >
              🎯 TARGET: {{ currency }}{{ comparisonData.target_price | number:'1.2-2' }}
            </text>

            <!-- Stop Loss Reference Line -->
            <line
              x1="0"
              [attr.y1]="stopLossY"
              [attr.x2]="width"
              [attr.y2]="stopLossY"
              stroke="#f43f5e"
              stroke-dasharray="5,3"
              stroke-width="1.5"
              opacity="0.8"
            />
            <rect
              x="12"
              [attr.y]="stopLossY + 4"
              width="155"
              height="16"
              rx="3"
              fill="rgba(244, 63, 94, 0.2)"
              stroke="#f43f5e"
              stroke-width="1"
            />
            <text
              x="18"
              [attr.y]="stopLossY + 16"
              fill="#f43f5e"
              font-size="9.5"
              font-weight="700"
              font-family="JetBrains Mono"
            >
              🛑 STOP LOSS: {{ currency }}{{ comparisonData.stop_loss | number:'1.2-2' }}
            </text>

            <!-- Base Prediction Price Line -->
            <line
              x1="0"
              [attr.y1]="predBaseY"
              [attr.x2]="width"
              [attr.y2]="predBaseY"
              stroke="#94a3b8"
              stroke-dasharray="3,3"
              stroke-width="1"
              opacity="0.6"
            />
            <text
              [attr.x]="width - 15"
              [attr.y]="predBaseY - 4"
              text-anchor="end"
              fill="#94a3b8"
              font-size="9"
              font-family="JetBrains Mono"
            >
              📌 PREDICTED BASE: {{ currency }}{{ comparisonData.predicted_base_price | number:'1.2-2' }}
            </text>

            <!-- Comparison Quantile Ribbon -->
            <polygon
              *ngIf="compareConfidencePolygon"
              [attr.points]="compareConfidencePolygon"
              fill="url(#compareCloudGradient)"
            />

            <!-- Past Prediction Trajectory Line (Amber Glowing Dashed) -->
            <polyline
              *ngIf="compareLinePath"
              [attr.points]="compareLinePath"
              fill="none"
              stroke="#f59e0b"
              stroke-width="3"
              stroke-dasharray="6,4"
              filter="drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))"
            />

            <!-- Past Prediction Checkpoints -->
            <g *ngFor="let cp of svgComparisonPoints">
              <circle
                [attr.cx]="cp.x"
                [attr.cy]="cp.y"
                r="5"
                fill="#080c14"
                stroke="#f59e0b"
                stroke-width="2.5"
              />
              <text
                [attr.x]="cp.x"
                [attr.y]="cp.y - 12"
                text-anchor="middle"
                fill="#f59e0b"
                font-size="10"
                font-weight="800"
                font-family="JetBrains Mono"
              >
                {{ currency }}{{ cp.predicted_close | number:'1.2-2' }}
              </text>
            </g>
          </g>

          <!-- ========================================================= -->
          <!-- FUTURE FORECAST OVERLAY (When showForecast && !showComparison) -->
          <!-- ========================================================= -->
          <g *ngIf="showForecast && !showComparison && forecastPoints.length > 0">
            <rect
              [attr.x]="forecastStartX"
              y="0"
              [attr.width]="width - forecastStartX"
              [attr.height]="chartHeight"
              fill="rgba(56, 189, 248, 0.03)"
            />
            <line
              [attr.x1]="forecastStartX"
              y1="0"
              [attr.x2]="forecastStartX"
              [attr.y2]="chartHeight"
              stroke="#38bdf8"
              stroke-dasharray="3,3"
              stroke-width="1.5"
            />
            <text
              [attr.x]="forecastStartX + 10"
              y="18"
              fill="#38bdf8"
              font-size="11"
              font-weight="700"
              font-family="Plus Jakarta Sans"
            >
              {{ forecastHorizon === '1D' ? '1-DAY INTRADAY PREDICTION HORIZON' : 'NEXT WEEK AI PREDICTION HORIZON' }}
            </text>

            <!-- Upper & Lower Confidence Area Cloud -->
            <polygon
              [attr.points]="forecastConfidencePolygon"
              fill="url(#forecastCloudGradient)"
            />

            <!-- Projected Forecast Trajectory Line -->
            <polyline
              [attr.points]="forecastLinePath"
              fill="none"
              stroke="#38bdf8"
              stroke-width="2.5"
              stroke-dasharray="6,4"
            />

            <!-- Forecast Data Points -->
            <g *ngFor="let fp of svgForecastPoints">
              <circle
                [attr.cx]="fp.x"
                [attr.cy]="fp.y"
                r="4.5"
                fill="#080c14"
                stroke="#38bdf8"
                stroke-width="2"
              />
              <text
                [attr.x]="fp.x"
                [attr.y]="fp.y - 10"
                text-anchor="middle"
                fill="#38bdf8"
                font-size="10"
                font-weight="700"
                font-family="JetBrains Mono"
              >
                {{ currency }}{{ fp.price | number:'1.2-2' }}
              </text>
              <text
                [attr.x]="fp.x"
                [attr.y]="chartHeight + 16"
                text-anchor="middle"
                fill="#94a3b8"
                font-size="10"
                font-family="Plus Jakarta Sans"
              >
                {{ fp.dayName }}
              </text>
            </g>
          </g>

          <!-- ========================================================= -->
          <!-- ACTUAL REALIZED GRAPH PRICE DATA (Area / Line) -->
          <!-- ========================================================= -->
          <g *ngIf="chartType === 'area'">
            <polygon
              [attr.points]="areaPolygon"
              [attr.fill]="isBullish ? 'url(#bullishGradient)' : 'url(#bearishGradient)'"
            />
            <polyline
              [attr.points]="linePath"
              fill="none"
              [attr.stroke]="isBullish ? '#10b981' : '#f43f5e'"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </g>

          <!-- Historical Candlestick Chart -->
          <g *ngIf="chartType === 'candles'">
            <g *ngFor="let c of svgCandles">
              <!-- Wick Line -->
              <line
                [attr.x1]="c.x"
                [attr.y1]="c.highY"
                [attr.x2]="c.x"
                [attr.y2]="c.lowY"
                [attr.stroke]="c.isUp ? '#10b981' : '#f43f5e'"
                stroke-width="1.2"
              />
              <!-- Candle Body -->
              <rect
                [attr.x]="c.x - c.width / 2"
                [attr.y]="c.bodyY"
                [attr.width]="c.width"
                [attr.height]="c.bodyHeight"
                [attr.fill]="c.isUp ? '#10b981' : '#f43f5e'"
                rx="1"
              />
            </g>
          </g>

          <!-- Hover Crosshair & Precise Line Marker -->
          <g *ngIf="hoverPointCoord">
            <line
              [attr.x1]="hoverPointCoord.x"
              y1="0"
              [attr.x2]="hoverPointCoord.x"
              [attr.y2]="chartHeight"
              stroke="rgba(255, 255, 255, 0.45)"
              stroke-dasharray="3,3"
              stroke-width="1.2"
            />
            <!-- Outer Pulsing Glow -->
            <circle
              [attr.cx]="hoverPointCoord.x"
              [attr.cy]="hoverPointCoord.y"
              r="10"
              fill="none"
              [attr.stroke]="showComparison ? '#f59e0b' : (hoveredForecast ? '#38bdf8' : (isBullish ? '#10b981' : '#f43f5e'))"
              stroke-width="1.5"
              opacity="0.5"
            />
            <!-- Main Circle Node -->
            <circle
              [attr.cx]="hoverPointCoord.x"
              [attr.cy]="hoverPointCoord.y"
              r="5.5"
              [attr.fill]="showComparison ? '#f59e0b' : (hoveredForecast ? '#38bdf8' : (isBullish ? '#10b981' : '#f43f5e'))"
              stroke="#ffffff"
              stroke-width="2"
            />
          </g>
        </svg>
      </div>

      <!-- Collapsible Bar-by-Bar Variance Matrix Table -->
      <div class="variance-matrix-container" *ngIf="showComparison && showMatrix && comparisonData">
        <div class="matrix-header">
          <h4>Detailed Step-by-Step Prediction Variance Matrix</h4>
          <span class="matrix-sub">Comparing forecasted quantile checkpoints against actual realized price points</span>
        </div>

        <div class="table-responsive">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>BAR / TIME</th>
                <th>PAST AI PREDICTION</th>
                <th>QUANTILE RANGE (Q10 - Q90)</th>
                <th>ACTUAL REALIZED CLOSE</th>
                <th>VARIANCE DELTA</th>
                <th>BAND STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bar of comparisonData.comparison_bars">
                <td class="mono font-bold">{{ bar.time_label }}</td>
                <td class="mono text-amber">{{ currency }}{{ bar.predicted_close | number:'1.2-2' }}</td>
                <td class="mono text-muted">{{ currency }}{{ bar.lower_bound | number:'1.2-2' }} - {{ currency }}{{ bar.upper_bound | number:'1.2-2' }}</td>
                <td class="mono font-bold text-white">{{ currency }}{{ bar.actual_close | number:'1.2-2' }}</td>
                <td class="mono" [class.text-bullish]="bar.variance_pct >= 0" [class.text-bearish]="bar.variance_pct < 0">
                  {{ bar.variance_pct >= 0 ? '+' : '' }}{{ bar.variance_pct }}% ({{ currency }}{{ bar.variance_amount }})
                </td>
                <td>
                  <span class="band-tag" [class.valid]="bar.within_confidence_band" [class.invalid]="!bar.within_confidence_band">
                    {{ bar.within_confidence_band ? '✅ IN BAND' : '⚠️ DEVIATED' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bottom Indicator Strip (RSI Breakdown & Legends) -->
      <div class="chart-indicators-footer">
        <div class="indicator-tag">
          <span class="ind-lbl">RSI (14):</span>
          <span class="ind-val mono" [class.text-bullish]="currentRsi < 40" [class.text-bearish]="currentRsi > 70">
            {{ currentRsi }}
          </span>
          <span class="ind-status">
            ({{ currentRsi < 35 ? 'Oversold / Bullish Rebound' : currentRsi > 70 ? 'Overbought / Resistance' : 'Neutral Range' }})
          </span>
        </div>

        <div class="legend-group">
          <div class="legend-item">
            <span class="leg-color leg-hist"></span>
            <span>Actual Realized {{ selectedTimeframe }}</span>
          </div>
          <div class="legend-item" *ngIf="showComparison">
            <span class="leg-color leg-compare"></span>
            <span>Past AI Prediction Trajectory</span>
          </div>
          <div class="legend-item" *ngIf="showComparison">
            <span class="leg-color leg-target"></span>
            <span>Target Price Marker</span>
          </div>
          <div class="legend-item" *ngIf="showForecast && !showComparison">
            <span class="leg-color leg-ai"></span>
            <span>{{ forecastHorizon === '1D' ? 'AI 1-Day Intraday Forecast' : 'AI 7-Day Forecast' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      display: flex;
      flex-direction: column;
      padding: 16px 20px;
      gap: 14px;
      position: relative;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .timeframe-group {
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;
    }

    .tf-btn {
      padding: 5px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .tf-btn:hover {
      color: var(--text-primary);
    }

    .tf-btn.active {
      background: rgba(0, 242, 254, 0.15);
      color: #00f2fe;
      box-shadow: 0 0 10px rgba(0, 242, 254, 0.25);
    }

    .header-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .horizon-switch-group {
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 2px;
      gap: 2px;
    }

    .horizon-switch-btn {
      padding: 4px 10px;
      font-size: 0.6875rem;
      font-weight: 800;
      color: var(--text-muted);
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .horizon-switch-btn:hover {
      color: var(--text-primary);
    }

    .horizon-switch-btn.active {
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
    }

    .toggle-forecast-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.25);
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .toggle-forecast-btn.active {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(139, 92, 246, 0.2));
      border-color: #38bdf8;
      color: #38bdf8;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
    }

    .toggle-compare-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      font-size: 0.75rem;
      font-weight: 700;
      transition: all 0.2s ease;
    }

    .toggle-compare-btn.active {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 179, 8, 0.15));
      border-color: #f59e0b;
      color: #fbbf24;
      box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);
    }

    .ai-spark-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 6px #38bdf8;
    }

    .compare-amber-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #f59e0b;
      box-shadow: 0 0 8px #f59e0b;
    }

    .badge-mini-ai {
      background: #38bdf8;
      color: #080c14;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .badge-mini-acc {
      background: #f59e0b;
      color: #080c14;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .type-selector {
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 3px;
    }

    .type-btn {
      padding: 5px 8px;
      color: var(--text-muted);
      border-radius: 6px;
      display: flex;
      align-items: center;
    }

    .type-btn.active {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }

    /* Comparison HUD Banner */
    .comparison-hud-banner {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(13, 20, 34, 0.9) 100%);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    .hud-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .hud-lbl {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hud-val-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .hud-sep {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .hud-sub {
      font-size: 0.6875rem;
      color: var(--text-secondary);
    }

    .badge-signal-pill {
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
    }
    .badge-signal-pill.buy {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-signal-pill.sell {
      background: rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      border: 1px solid rgba(244, 63, 94, 0.4);
    }

    .accuracy-score {
      font-size: 1.125rem;
      font-weight: 800;
      color: #10b981;
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    }

    .hud-status-pill {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .hud-status-pill.hit {
      background: rgba(16, 185, 129, 0.25);
      color: #10b981;
      border-color: #10b981;
    }
    .hud-status-pill.tracking {
      background: rgba(0, 242, 254, 0.2);
      color: #00f2fe;
      border-color: #00f2fe;
    }

    .right-toggle {
      justify-content: center;
      align-items: flex-end;
    }

    .btn-matrix-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--text-primary);
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .btn-matrix-toggle:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: #00f2fe;
      color: #00f2fe;
    }

    /* Variance Matrix Table */
    .variance-matrix-container {
      background: #090e18;
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .matrix-header h4 {
      font-size: 0.875rem;
      font-weight: 700;
      color: #fbbf24;
      margin: 0;
    }

    .matrix-sub {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }

    .matrix-table th {
      text-align: left;
      padding: 8px 10px;
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      text-transform: uppercase;
    }

    .matrix-table td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .band-tag {
      font-size: 0.625rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .band-tag.valid {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }
    .band-tag.invalid {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
    }

    .chart-meta-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 6px 14px;
      font-size: 0.75rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-lbl {
      color: var(--text-muted);
      font-weight: 600;
    }

    .meta-val {
      font-weight: 700;
      color: var(--text-primary);
    }

    .compare-hover-pill {
      margin-left: auto;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .ai-hover-pill {
      margin-left: auto;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .text-amber {
      color: #f59e0b;
    }

    .text-cyan {
      color: #38bdf8;
    }

    .meta-conf {
      color: var(--text-secondary);
      font-size: 0.6875rem;
    }

    .svg-container {
      width: 100%;
      height: 380px;
      position: relative;
      cursor: crosshair;
    }

    .main-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .chart-indicators-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 6px;
      border-top: 1px solid var(--border-color);
      font-size: 0.75rem;
    }

    .indicator-tag {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ind-lbl {
      color: var(--text-muted);
      font-weight: 700;
    }

    .ind-val {
      font-weight: 800;
    }

    .ind-status {
      color: var(--text-secondary);
      font-size: 0.6875rem;
    }

    .legend-group {
      display: flex;
      align-items: center;
      gap: 14px;
      color: var(--text-secondary);
      font-size: 0.6875rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .leg-color {
      width: 12px;
      height: 3px;
      border-radius: 2px;
    }

    .leg-hist {
      background: #10b981;
    }

    .leg-compare {
      background: #f59e0b;
      border: 1px dashed #f59e0b;
    }

    .leg-target {
      background: #10b981;
      border: 1px dashed #10b981;
    }

    .leg-ai {
      background: #38bdf8;
      border: 1px dashed #38bdf8;
    }

    @media (max-width: 640px) {
      .svg-container {
        height: 280px;
      }
      .chart-header {
        flex-direction: column;
        align-items: stretch;
      }
      .timeframe-group {
        justify-content: space-between;
      }
    }
  `]
})
export class TradingChartComponent implements OnInit, OnChanges {
  @Input() historicalData: { [tf: string]: PricePoint[] } = {};
  @Input() forecastPoints: ForecastPoint[] = [];
  @Input() forecast1DPoints: ForecastPoint[] = [];
  @Input() currency: string = '₹';
  @Input() currentRsi: number = 42.5;
  @Input() symbol?: string;
  @Input() comparisonData?: PredictionComparisonResponse | null = null;

  @ViewChild('svgContainer', { static: false }) svgContainerRef!: ElementRef;

  timeframes: string[] = ['1D', '1W', '1M', '1Y', '5Y'];
  selectedTimeframe: string = '1D';
  chartType: 'area' | 'candles' = 'area';
  showForecast: boolean = true;
  showComparison: boolean = false;
  showMatrix: boolean = false;
  forecastHorizon: '1D' | '7D' = '7D';

  width: number = 800;
  height: number = 380;
  chartHeight: number = 340;

  activePoints: PricePoint[] = [];
  gridLines: { y: number; price: number }[] = [];
  
  linePath: string = '';
  areaPolygon: string = '';
  forecastLinePath: string = '';
  forecastConfidencePolygon: string = '';
  forecastStartX: number = 0;

  // Comparison Paths & Coordinates
  compareLinePath: string = '';
  compareConfidencePolygon: string = '';
  targetPriceY: number = 0;
  stopLossY: number = 0;
  predBaseY: number = 0;
  svgComparisonPoints: { x: number; y: number; predicted_close: number; actual_close: number; time_label: string; variance_pct: number; inBand: boolean }[] = [];
  hoveredComparePoint: ComparisonBarPoint | null = null;

  svgCandles: { x: number; width: number; highY: number; lowY: number; bodyY: number; bodyHeight: number; isUp: boolean }[] = [];
  svgForecastPoints: { x: number; y: number; price: number; dayName: string }[] = [];

  renderedHistoricalCoords: { x: number; y: number }[] = [];
  hoverX: number = -1;
  hoveredPoint: PricePoint | null = null;
  hoveredForecast: ForecastPoint | null = null;
  hoverPointCoord: { x: number; y: number } | null = null;
  latestPoint: PricePoint | null = null;
  isBullish: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.selectTimeframe(this.selectedTimeframe);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['historicalData'] || changes['comparisonData'] || changes['forecastPoints']) {
      this.selectTimeframe(this.selectedTimeframe);
    }
  }

  get activeForecastPoints(): ForecastPoint[] {
    if (this.forecastHorizon === '1D') {
      if (this.forecast1DPoints && this.forecast1DPoints.length > 0) {
        return this.forecast1DPoints;
      }
      return this.generateFallback1DForecast();
    }
    return this.forecastPoints || [];
  }

  setForecastHorizon(horizon: '1D' | '7D'): void {
    this.forecastHorizon = horizon;
    this.renderChart();
  }

  toggleComparison(): void {
    this.showComparison = !this.showComparison;
    if (this.showComparison) {
      this.showForecast = false;
    }
    this.renderChart();
  }

  toggleForecast(): void {
    this.showForecast = !this.showForecast;
    if (this.showForecast) {
      this.showComparison = false;
    }
    this.renderChart();
  }

  selectTimeframe(tf: string): void {
    this.selectedTimeframe = tf;
    if (tf === '1D') {
      this.forecastHorizon = '1D';
    } else {
      this.forecastHorizon = '7D';
    }

    let points = this.historicalData?.[tf] || [];

    // If few points (e.g. outside exchange hours), expand into smooth intraday points
    if (points.length >= 1 && points.length < 10) {
      points = this.expandIntradayPoints(points, tf);
    } else if (!points || points.length === 0) {
      points = this.generateFallbackPoints(this.latestPoint?.close || 150.0, tf);
    }

    this.activePoints = points;
    if (this.activePoints.length > 0) {
      this.latestPoint = this.activePoints[this.activePoints.length - 1];
      const first = this.activePoints[0];
      this.isBullish = this.latestPoint.close >= first.close;
    }
    this.renderChart();
  }

  private expandIntradayPoints(raw: PricePoint[], tf: string): PricePoint[] {
    const last = raw[raw.length - 1];
    const openP = raw[0].open || last.open || last.close;
    const highP = Math.max(...raw.map(r => r.high || r.close));
    const lowP = Math.min(...raw.map(r => r.low || r.close));
    const closeP = last.close;

    const count = tf === '1D' ? 35 : 24;
    const expanded: PricePoint[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      const wave = Math.sin(progress * Math.PI * 2) * Math.max(1.0, (highP - lowP) * 0.35);
      const cur = openP + (closeP - openP) * progress + wave;
      const h = Math.max(cur, cur + Math.abs(highP - cur) * 0.25);
      const l = Math.min(cur, cur - Math.abs(cur - lowP) * 0.25);

      const d = new Date(now.getTime() - (count - 1 - i) * 10 * 60 * 1000);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

      expanded.push({
        timestamp: d.toISOString(),
        time_label: tf === '1D' ? timeStr : d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' }),
        open: Number(cur.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(cur.toFixed(2)),
        volume: Math.round(5000 + Math.random() * 8000)
      });
    }
    return expanded;
  }

  private generateFallbackPoints(baseP: number, tf: string): PricePoint[] {
    const count = tf === '1D' ? 35 : tf === '1W' ? 25 : 30;
    return Array.from({ length: count }, (_, i) => {
      const p = baseP * (1 + (i * 0.001) - 0.015);
      return {
        timestamp: new Date().toISOString(),
        time_label: `${i + 1}`,
        open: p * 0.998,
        high: p * 1.004,
        low: p * 0.995,
        close: p,
        volume: 5000 + i * 100
      };
    });
  }

  private generateFallback1DForecast(): ForecastPoint[] {
    const baseP = this.latestPoint?.close || 150.0;
    const slots = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];
    return slots.map((s, idx) => {
      const step = idx + 1;
      const proj = baseP * (1 + 0.003 * (step / slots.length) + Math.sin(step * 0.9) * 0.002);
      const spread = proj * 0.006 * Math.sqrt(step);
      return {
        day: step,
        date: `Tomorrow ${s}`,
        day_name: s,
        predicted_close: Math.round(proj * 100) / 100,
        upper_bound: Math.round((proj + spread) * 100) / 100,
        lower_bound: Math.round((proj - spread) * 100) / 100,
        confidence_pct: Math.round((96 - step * 2.1) * 10) / 10,
        trend: 'UP'
      };
    });
  }

  renderChart(): void {
    if (!this.activePoints || this.activePoints.length === 0) return;

    const histPoints = this.activePoints;
    const currentForecast = this.activeForecastPoints;
    const includeForecast = this.showForecast && !this.showComparison && currentForecast && currentForecast.length > 0;

    // 1. Calculate historical price bounds
    const lows = histPoints.map(p => p.low).filter(v => v > 0);
    const highs = histPoints.map(p => p.high).filter(v => v > 0);
    const closes = histPoints.map(p => p.close).filter(v => v > 0);

    let minPrice = lows.length ? Math.min(...lows) : Math.min(...closes);
    let maxPrice = highs.length ? Math.max(...highs) : Math.max(...closes);

    let spread = maxPrice - minPrice;
    if (spread <= 0 || spread < minPrice * 0.003) {
      minPrice = minPrice * 0.995;
      maxPrice = maxPrice * 1.005;
      spread = maxPrice - minPrice;
    }

    // 2. Proportional forecast incorporation
    if (includeForecast) {
      const fCloses = currentForecast.map(p => p.predicted_close);
      const fMin = Math.min(...fCloses);
      const fMax = Math.max(...fCloses);

      const maxAllowedExpansion = spread * 1.4;
      const fLower = Math.max(minPrice - maxAllowedExpansion, Math.min(...currentForecast.map(p => p.lower_bound)));
      const fUpper = Math.min(maxPrice + maxAllowedExpansion, Math.max(...currentForecast.map(p => p.upper_bound)));

      minPrice = Math.min(minPrice, fMin, fLower);
      maxPrice = Math.max(maxPrice, fMax, fUpper);
    }

    // 3. Prediction Comparison Incorporation
    if (this.showComparison && this.comparisonData) {
      const c = this.comparisonData;
      const compPrices = [
        c.predicted_base_price,
        c.target_price,
        c.stop_loss,
        c.current_market_price,
        ...(c.comparison_bars || []).map(b => b.predicted_close),
        ...(c.comparison_bars || []).map(b => b.actual_close)
      ].filter(v => v > 0);

      if (compPrices.length > 0) {
        minPrice = Math.min(minPrice, ...compPrices);
        maxPrice = Math.max(maxPrice, ...compPrices);
      }
    }

    // 4. Add vertical padding
    const padding = Math.max((maxPrice - minPrice) * 0.08, minPrice * 0.005);
    minPrice = Math.max(0.01, minPrice - padding);
    maxPrice = maxPrice + padding;
    const priceRange = Math.max(0.01, maxPrice - minPrice);

    // 5. Compute Grid Lines
    this.gridLines = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const y = this.chartHeight * (1 - ratio) + 10;
      const p = minPrice + (priceRange * ratio);
      this.gridLines.push({ y, price: p });
    }

    // 6. Layout allocation (72% historical when future forecast is on, 100% when comparison is on)
    const histFraction = includeForecast ? 0.72 : 1.0;
    const histWidth = this.width * histFraction;

    const scaleY = (val: number) => {
      const clamped = Math.max(minPrice, Math.min(maxPrice, val));
      return this.chartHeight - ((clamped - minPrice) / priceRange * (this.chartHeight - 30)) - 10;
    };

    // Calculate historical coords
    const coords: { x: number; y: number }[] = [];
    this.svgCandles = [];

    const stepX = histWidth / Math.max(1, histPoints.length - 1);
    const candleWidth = Math.max(3, Math.min(12, stepX * 0.7));

    histPoints.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = scaleY(pt.close);
      coords.push({ x, y });

      const highY = scaleY(pt.high);
      const lowY = scaleY(pt.low);
      const openY = scaleY(pt.open);
      const closeY = scaleY(pt.close);
      const isUp = pt.close >= pt.open;

      this.svgCandles.push({
        x,
        width: candleWidth,
        highY,
        lowY,
        bodyY: Math.min(openY, closeY),
        bodyHeight: Math.max(2, Math.abs(closeY - openY)),
        isUp
      });
    });

    this.renderedHistoricalCoords = coords;

    // Build Line Path & Area Polygon
    this.linePath = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    this.areaPolygon = `0,${this.chartHeight} ` + this.linePath + ` ${coords[coords.length - 1].x.toFixed(1)},${this.chartHeight}`;

    // 7. Calculate Future Forecast Coords
    if (includeForecast) {
      this.forecastStartX = histWidth;
      const fWidth = this.width - histWidth;
      const fStepX = fWidth / (currentForecast.length + 0.5);

      const fCoords: { x: number; y: number; upperY: number; lowerY: number }[] = [];
      const lastHist = coords[coords.length - 1];

      fCoords.push({
        x: lastHist.x,
        y: lastHist.y,
        upperY: lastHist.y,
        lowerY: lastHist.y
      });

      this.svgForecastPoints = [];

      currentForecast.forEach((fp, idx) => {
        const x = histWidth + (idx + 1) * fStepX;
        const y = scaleY(fp.predicted_close);
        const upperY = scaleY(fp.upper_bound);
        const lowerY = scaleY(fp.lower_bound);

        fCoords.push({ x, y, upperY, lowerY });
        this.svgForecastPoints.push({
          x,
          y,
          price: fp.predicted_close,
          dayName: fp.day_name
        });
      });

      this.forecastLinePath = fCoords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
      const upperStr = fCoords.map(c => `${c.x.toFixed(1)},${c.upperY.toFixed(1)}`).join(' ');
      const lowerStr = [...fCoords].reverse().map(c => `${c.x.toFixed(1)},${c.lowerY.toFixed(1)}`).join(' ');
      this.forecastConfidencePolygon = `${upperStr} ${lowerStr}`;
    }

    // 8. Calculate Comparison Coordinates (When showComparison)
    if (this.showComparison && this.comparisonData) {
      const c = this.comparisonData;
      this.targetPriceY = scaleY(c.target_price);
      this.stopLossY = scaleY(c.stop_loss);
      this.predBaseY = scaleY(c.predicted_base_price);

      const compBars = c.comparison_bars || [];
      const numComp = Math.max(1, compBars.length);
      const compStepX = this.width / Math.max(1, numComp - 1);

      const cCoords: { x: number; y: number; upperY: number; lowerY: number }[] = [];
      this.svgComparisonPoints = [];

      compBars.forEach((cb, idx) => {
        const x = idx * compStepX;
        const y = scaleY(cb.predicted_close);
        const upperY = scaleY(cb.upper_bound);
        const lowerY = scaleY(cb.lower_bound);

        cCoords.push({ x, y, upperY, lowerY });
        this.svgComparisonPoints.push({
          x,
          y,
          predicted_close: cb.predicted_close,
          actual_close: cb.actual_close,
          time_label: cb.time_label,
          variance_pct: cb.variance_pct,
          inBand: cb.within_confidence_band
        });
      });

      this.compareLinePath = cCoords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      const cUpperStr = cCoords.map(p => `${p.x.toFixed(1)},${p.upperY.toFixed(1)}`).join(' ');
      const cLowerStr = [...cCoords].reverse().map(p => `${p.x.toFixed(1)},${p.lowerY.toFixed(1)}`).join(' ');
      this.compareConfidencePolygon = `${cUpperStr} ${cLowerStr}`;
    }

    this.cdr.markForCheck();
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.svgContainerRef.nativeElement.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const normX = (relX / rect.width) * this.width;

    this.hoverX = Math.max(0, Math.min(this.width, normX));

    if (this.showComparison && this.svgComparisonPoints.length > 0) {
      const idx = Math.round((this.hoverX / this.width) * (this.svgComparisonPoints.length - 1));
      const clampedIdx = Math.max(0, Math.min(this.svgComparisonPoints.length - 1, idx));
      const cp = this.svgComparisonPoints[clampedIdx];
      
      this.hoveredComparePoint = this.comparisonData?.comparison_bars?.[clampedIdx] || null;
      this.hoverPointCoord = { x: cp.x, y: cp.y };

      if (this.activePoints.length > 0) {
        const hIdx = Math.round((this.hoverX / this.width) * (this.activePoints.length - 1));
        this.hoveredPoint = this.activePoints[Math.max(0, Math.min(this.activePoints.length - 1, hIdx))];
      }
      return;
    }

    const currentForecast = this.activeForecastPoints;
    const includeForecast = this.showForecast && !this.showComparison && currentForecast.length > 0;
    const histFraction = includeForecast ? 0.72 : 1.0;
    const histWidth = this.width * histFraction;

    if (this.hoverX <= histWidth && this.activePoints.length > 0 && this.renderedHistoricalCoords.length > 0) {
      const idx = Math.round((this.hoverX / histWidth) * (this.activePoints.length - 1));
      const clampedIdx = Math.max(0, Math.min(this.activePoints.length - 1, idx));
      this.hoveredPoint = this.activePoints[clampedIdx];
      this.hoveredForecast = null;
      this.hoverPointCoord = this.renderedHistoricalCoords[clampedIdx];
    } else if (includeForecast && this.svgForecastPoints.length > 0) {
      const fWidth = this.width - histWidth;
      const fRelX = this.hoverX - histWidth;
      const fIdx = Math.floor((fRelX / fWidth) * currentForecast.length);
      const clampedFIdx = Math.max(0, Math.min(currentForecast.length - 1, fIdx));
      this.hoveredForecast = currentForecast[clampedFIdx];
      this.hoveredPoint = null;
      if (this.svgForecastPoints[clampedFIdx]) {
        this.hoverPointCoord = {
          x: this.svgForecastPoints[clampedFIdx].x,
          y: this.svgForecastPoints[clampedFIdx].y
        };
      } else {
        this.hoverPointCoord = null;
      }
    }
  }

  onMouseLeave(): void {
    this.hoverX = -1;
    this.hoveredPoint = null;
    this.hoveredForecast = null;
    this.hoveredComparePoint = null;
    this.hoverPointCoord = null;
  }
}
