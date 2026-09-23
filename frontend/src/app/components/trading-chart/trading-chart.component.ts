import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PricePoint, ForecastPoint } from '../../models/trade.models';

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
          <div class="horizon-switch-group" *ngIf="showForecast">
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

          <!-- Toggle AI Forecast Overlay -->
          <button
            class="toggle-forecast-btn"
            [class.active]="showForecast"
            (click)="toggleForecast()"
          >
            <div class="ai-spark-dot"></div>
            <span>{{ forecastHorizon === '1D' ? '1-Day Future Forecast' : '7-Day Future Forecast' }}</span>
            <span class="badge-mini-ai">{{ forecastHorizon }}</span>
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

      <!-- Live Hover Detail Bar -->
      <div class="chart-meta-bar" *ngIf="hoveredPoint || latestPoint">
        <div class="meta-item">
          <span class="meta-lbl">TIME / DATE:</span>
          <span class="meta-val mono">{{ hoveredPoint?.time_label || latestPoint?.time_label }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">CLOSE:</span>
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
        <div class="meta-item ai-hover-pill" *ngIf="hoveredForecast">
          <span class="ai-pill-dot"></span>
          <span class="meta-lbl">AI PREDICTED:</span>
          <span class="meta-val mono text-cyan">{{ currency }}{{ hoveredForecast.predicted_close | number:'1.2-2' }}</span>
          <span class="meta-conf mono">({{ hoveredForecast.confidence_pct }}% Conf.)</span>
        </div>
      </div>

      <!-- Main SVG Chart Canvas -->
      <div class="svg-container" #svgContainer (mousemove)="onMouseMove($event)" (mouseleave)="onMouseLeave()">
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="main-svg" preserveAspectRatio="none">
          <defs>
            <!-- Historical Area Gradient -->
            <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
            </linearGradient>

            <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.0" />
            </linearGradient>

            <!-- Forecast Cloud Area Gradient -->
            <linearGradient id="forecastCloudGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05" />
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

          <!-- Forecast Region Background Shading -->
          <g *ngIf="showForecast && forecastPoints.length > 0">
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
              NEXT WEEK AI PREDICTION HORIZON
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
                {{ currency }}{{ fp.price | number:'1.1-1' }}
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

          <!-- Historical Area & Line Chart -->
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
              [attr.stroke]="hoveredForecast ? '#38bdf8' : (isBullish ? '#10b981' : '#f43f5e')"
              stroke-width="1.5"
              opacity="0.5"
            />
            <!-- Main Circle Node -->
            <circle
              [attr.cx]="hoverPointCoord.x"
              [attr.cy]="hoverPointCoord.y"
              r="5.5"
              [attr.fill]="hoveredForecast ? '#38bdf8' : (isBullish ? '#10b981' : '#f43f5e')"
              stroke="#ffffff"
              stroke-width="2"
            />
          </g>
        </svg>
      </div>

      <!-- Bottom Indicator Strip (RSI Breakdown) -->
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
            <span>Historical {{ selectedTimeframe }}</span>
          </div>
          <div class="legend-item" *ngIf="showForecast">
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

    .ai-spark-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 6px #38bdf8;
    }

    .badge-mini-ai {
      background: #38bdf8;
      color: #080c14;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 5px;
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

    .ai-hover-pill {
      margin-left: auto;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .ai-pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
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

  @ViewChild('svgContainer', { static: false }) svgContainerRef!: ElementRef;

  timeframes: string[] = ['1D', '1W', '1M', '1Y', '5Y'];
  selectedTimeframe: string = '1D';
  chartType: 'area' | 'candles' = 'area';
  showForecast: boolean = true;
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
    this.selectTimeframe(this.selectedTimeframe);
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

  toggleForecast(): void {
    this.showForecast = !this.showForecast;
    this.renderChart();
  }

  renderChart(): void {
    if (!this.activePoints || this.activePoints.length === 0) return;

    const histPoints = this.activePoints;
    const currentForecast = this.activeForecastPoints;
    const includeForecast = this.showForecast && currentForecast && currentForecast.length > 0;

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

      // Clamp forecast confidence bounds to prevent squashing historical candles
      const maxAllowedExpansion = spread * 1.4;
      const fLower = Math.max(minPrice - maxAllowedExpansion, Math.min(...currentForecast.map(p => p.lower_bound)));
      const fUpper = Math.min(maxPrice + maxAllowedExpansion, Math.max(...currentForecast.map(p => p.upper_bound)));

      minPrice = Math.min(minPrice, fMin, fLower);
      maxPrice = Math.max(maxPrice, fMax, fUpper);
    }

    // 3. Add 8% vertical margin
    const padding = Math.max((maxPrice - minPrice) * 0.08, minPrice * 0.005);
    minPrice = Math.max(0.01, minPrice - padding);
    maxPrice = maxPrice + padding;
    const priceRange = Math.max(0.01, maxPrice - minPrice);

    // 4. Compute Grid Lines
    this.gridLines = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const y = this.chartHeight * (1 - ratio) + 10;
      const p = minPrice + (priceRange * ratio);
      this.gridLines.push({ y, price: p });
    }

    // 5. Layout allocation (72% historical, 28% forecast)
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

    // Save exact rendered coordinates for precision hover locking
    this.renderedHistoricalCoords = coords;

    // Build Line Path & Area Polygon
    this.linePath = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    this.areaPolygon = `0,${this.chartHeight} ` + this.linePath + ` ${coords[coords.length - 1].x.toFixed(1)},${this.chartHeight}`;

    // 6. Calculate Forecast Coords
    if (includeForecast) {
      this.forecastStartX = histWidth;
      const fWidth = this.width - histWidth;
      const fStepX = fWidth / (currentForecast.length + 0.5);

      const fCoords: { x: number; y: number; upperY: number; lowerY: number }[] = [];
      const lastHist = coords[coords.length - 1];

      // Seamless start from last trade point
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

    this.cdr.markForCheck();
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.svgContainerRef.nativeElement.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const normX = (relX / rect.width) * this.width;

    this.hoverX = Math.max(0, Math.min(this.width, normX));

    const currentForecast = this.activeForecastPoints;
    const includeForecast = this.showForecast && currentForecast.length > 0;
    const histFraction = includeForecast ? 0.72 : 1.0;
    const histWidth = this.width * histFraction;

    if (this.hoverX <= histWidth && this.activePoints.length > 0 && this.renderedHistoricalCoords.length > 0) {
      const idx = Math.round((this.hoverX / histWidth) * (this.activePoints.length - 1));
      const clampedIdx = Math.max(0, Math.min(this.activePoints.length - 1, idx));
      this.hoveredPoint = this.activePoints[clampedIdx];
      this.hoveredForecast = null;
      // Precision coordinate lock directly on the rendered line curve
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
    this.hoverPointCoord = null;
  }
}
