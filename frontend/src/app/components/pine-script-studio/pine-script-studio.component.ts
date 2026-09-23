import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TradeApiService } from '../../services/trade-api.service';
import { PineScriptItem, PineScriptPreset } from '../../models/trade.models';

@Component({
  selector: 'app-pine-script-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="pine-studio-page">
      <!-- Studio Header -->
      <div class="studio-header glass-panel">
        <div class="header-left">
          <div class="title-row">
            <div class="badge-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div>
              <h1>TradingView Pine Script Studio</h1>
              <p class="subtitle">Generate, backtest simulate, and export production-grade Pine Script v5 algorithms powered by TradeAI & TimesFM 3.0.</p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="activeTab = 'library'" [class.active-tab-btn]="activeTab === 'library'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Saved Scripts ({{ savedScripts.length }})</span>
          </button>
          <button class="btn btn-primary" (click)="activeTab = 'generator'" [class.active-tab-btn]="activeTab === 'generator'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>Strategy Generator</span>
          </button>
        </div>
      </div>

      <!-- Main Studio Layout -->
      <div class="studio-body" *ngIf="activeTab === 'generator'">
        <!-- Left: Configuration Panel -->
        <div class="config-sidebar glass-panel">
          <div class="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <h3>Strategy Parameters</h3>
          </div>

          <!-- Symbol & Timeframe -->
          <div class="form-group">
            <label>Target Asset Symbol</label>
            <div class="input-with-quick">
              <input type="text" [(ngModel)]="selectedSymbol" class="form-control mono" placeholder="e.g. TATASIL, RELIANCE" />
            </div>
            <div class="quick-tags">
              <span *ngFor="let s of quickSymbols" (click)="selectedSymbol = s" [class.selected-tag]="selectedSymbol === s" class="tag-badge">
                {{ s }}
              </span>
            </div>
          </div>

          <!-- Preset Selector -->
          <div class="form-group">
            <label>Strategy Preset</label>
            <select [(ngModel)]="selectedPresetId" (change)="onPresetChange()" class="form-control">
              <option *ngFor="let p of presets" [value]="p.id">{{ p.name }}</option>
            </select>
            <p class="field-hint" *ngIf="currentPreset">{{ currentPreset.description }}</p>
          </div>

          <!-- Timeframe & Script Type -->
          <div class="form-row-2">
            <div class="form-group">
              <label>Timeframe</label>
              <select [(ngModel)]="selectedTimeframe" class="form-control mono">
                <option value="1m">1 Min (Scalp)</option>
                <option value="5m">5 Min (Intraday)</option>
                <option value="15m">15 Min (Swing)</option>
                <option value="1h">1 Hour (Macro)</option>
                <option value="1D">1 Day (Positional)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Script Type</label>
              <select [(ngModel)]="selectedScriptType" class="form-control">
                <option value="strategy">Strategy (Auto Execution)</option>
                <option value="indicator">Indicator (Overlay Study)</option>
              </select>
            </div>
          </div>

          <!-- Dynamic Preset Parameters -->
          <div class="dynamic-params-container" *ngIf="dynamicInputs">
            <label class="section-sub-label">Customizable Algorithm Inputs</label>
            <div *ngFor="let key of objectKeys(dynamicInputs)" class="param-row">
              <span class="param-name mono">{{ formatParamKey(key) }}</span>
              <input *ngIf="isNumber(dynamicInputs[key])" type="number" [(ngModel)]="dynamicInputs[key]" class="param-input mono" step="0.1" />
              <input *ngIf="isString(dynamicInputs[key])" type="text" [(ngModel)]="dynamicInputs[key]" class="param-input mono" />
              <input *ngIf="isBoolean(dynamicInputs[key])" type="checkbox" [(ngModel)]="dynamicInputs[key]" class="param-checkbox" />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="generator-actions">
            <button class="btn btn-primary btn-block pulse-btn" (click)="generateScript()" [disabled]="isGenerating">
              <span *ngIf="!isGenerating">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Generate Pine Script v5
              </span>
              <span *ngIf="isGenerating" class="flex-center">
                <div class="spinner-sm"></div> Compiling TradingView Algorithm...
              </span>
            </button>
          </div>
        </div>

        <!-- Right: Code Editor & Backtest Stats -->
        <div class="code-and-stats-column">
          <!-- Backtest / Performance Stats Bar -->
          <div class="stats-card glass-panel" *ngIf="currentScript?.backtest_stats">
            <div class="stats-header">
              <div class="stats-title-group">
                <span class="pulse-dot"></span>
                <h4>Simulated 90-Day Backtest Metrics ({{ currentScript?.symbol }} - {{ currentScript?.timeframe }})</h4>
              </div>
              <span class="sim-badge">Synthetic Engine</span>
            </div>

            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-lbl">Win Rate</span>
                <span class="metric-val text-bullish">{{ currentScript?.backtest_stats?.win_rate }}%</span>
              </div>
              <div class="metric-box">
                <span class="metric-lbl">Profit Factor</span>
                <span class="metric-val text-cyan">{{ currentScript?.backtest_stats?.profit_factor }}</span>
              </div>
              <div class="metric-box">
                <span class="metric-lbl">Net Profit</span>
                <span class="metric-val text-bullish">+{{ currentScript?.backtest_stats?.net_profit_pct }}%</span>
              </div>
              <div class="metric-box">
                <span class="metric-lbl">Total Trades</span>
                <span class="metric-val text-white">{{ currentScript?.backtest_stats?.total_trades }}</span>
              </div>
              <div class="metric-box">
                <span class="metric-lbl">Max Drawdown</span>
                <span class="metric-val text-bearish">-{{ currentScript?.backtest_stats?.max_drawdown_pct }}%</span>
              </div>
              <div class="metric-box">
                <span class="metric-lbl">Sharpe Ratio</span>
                <span class="metric-val text-gold">{{ currentScript?.backtest_stats?.sharpe_ratio }}</span>
              </div>
            </div>
          </div>

          <!-- Code Editor Panel -->
          <div class="editor-card glass-panel">
            <div class="editor-header">
              <div class="editor-info">
                <span class="file-name mono">{{ currentScript?.title || 'TradeAI_Strategy.pine' }}</span>
                <span class="tag-version">{{ currentScript?.pine_version || '//@version=5' }}</span>
              </div>

              <div class="editor-buttons">
                <button class="btn btn-xs btn-outline" (click)="copyCodeToClipboard()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>{{ copyBtnText }}</span>
                </button>

                <button class="btn btn-xs btn-outline" (click)="downloadPineFile()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Download .pine</span>
                </button>

                <button class="btn btn-xs btn-save" (click)="saveScriptToDb()" [disabled]="isSaving">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span>{{ isSaving ? 'Saving...' : 'Save to Library' }}</span>
                </button>
              </div>
            </div>

            <!-- Code Display Area -->
            <div class="code-container">
              <textarea [(ngModel)]="currentCode" class="code-textarea mono" spellcheck="false" placeholder="// Pine Script code will appear here..."></textarea>
            </div>

            <!-- How to use in TradingView Guide -->
            <div class="guide-footer">
              <div class="guide-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>How to use in TradingView:</span>
              </div>
              <ol class="guide-steps">
                <li>Click <strong>Copy Code</strong> above.</li>
                <li>Open <strong>TradingView.com</strong> and select your chart.</li>
                <li>Open the <strong>Pine Editor</strong> tab at the bottom toolbar.</li>
                <li>Paste the code, click <strong>Save</strong>, then click <strong>Add to Chart</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Saved Scripts Library Tab -->
      <div class="library-view" *ngIf="activeTab === 'library'">
        <div class="library-header glass-panel">
          <h3>Your Saved Pine Script Algorithms</h3>
          <p class="subtitle">Scripts saved to PostgreSQL with full backtest history and execution triggers.</p>
        </div>

        <div class="empty-state glass-panel" *ngIf="savedScripts.length === 0">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          <p>No saved Pine Scripts found in your database.</p>
          <button class="btn btn-primary" (click)="activeTab = 'generator'">Generate New Strategy</button>
        </div>

        <div class="scripts-grid" *ngIf="savedScripts.length > 0">
          <div *ngFor="let item of savedScripts" class="script-card glass-panel">
            <div class="card-top">
              <div class="sym-badge-row">
                <span class="badge-sym mono">{{ item.symbol }}</span>
                <span class="badge-tf mono">{{ item.timeframe }}</span>
                <span class="badge-type">{{ item.script_type | uppercase }}</span>
              </div>
              <button class="btn-icon-del" (click)="deleteSavedScript(item.id, $event)" title="Delete script">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>

            <h4 class="script-card-title">{{ item.title }}</h4>
            <p class="script-card-desc">{{ item.description }}</p>

            <div class="card-stats-row" *ngIf="item.backtest_stats">
              <div class="c-stat">
                <span class="c-lbl">Win Rate</span>
                <span class="c-val text-bullish">{{ item.backtest_stats.win_rate }}%</span>
              </div>
              <div class="c-stat">
                <span class="c-lbl">Profit Factor</span>
                <span class="c-val text-cyan">{{ item.backtest_stats.profit_factor }}</span>
              </div>
              <div class="c-stat">
                <span class="c-lbl">Net Profit</span>
                <span class="c-val text-bullish">+{{ item.backtest_stats.net_profit_pct }}%</span>
              </div>
            </div>

            <div class="card-actions">
              <button class="btn btn-xs btn-primary" (click)="loadSavedScript(item)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Load in Editor</span>
              </button>
              <a [href]="getDownloadUrl(item.id)" class="btn btn-xs btn-outline" download>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>.pine</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pine-studio-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-bottom: 40px;
    }

    .studio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .badge-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 70, 229, 0.2));
      border: 1px solid rgba(0, 242, 254, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00f2fe;
    }

    .studio-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .active-tab-btn {
      background: linear-gradient(135deg, #00f2fe, #4facfe) !important;
      color: #030b1e !important;
      font-weight: 600;
      box-shadow: 0 0 16px rgba(0, 242, 254, 0.4);
    }

    /* Layout */
    .studio-body {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .studio-body {
        grid-template-columns: 1fr;
      }
    }

    .config-sidebar {
      padding: 24px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #00f2fe;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 12px;
    }

    .section-title h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      color: #f1f5f9;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      font-weight: 600;
    }

    .form-control {
      background: rgba(10, 15, 29, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      color: #f8fafc;
      padding: 10px 12px;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      border-color: #00f2fe;
      box-shadow: 0 0 10px rgba(0, 242, 254, 0.25);
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field-hint {
      font-size: 0.75rem;
      color: #64748b;
      margin: 4px 0 0 0;
      line-height: 1.4;
    }

    .quick-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .tag-badge {
      font-size: 0.75rem;
      font-family: monospace;
      padding: 3px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tag-badge:hover, .selected-tag {
      background: rgba(0, 242, 254, 0.15);
      border-color: #00f2fe;
      color: #00f2fe;
    }

    .dynamic-params-container {
      background: rgba(0, 0, 0, 0.25);
      padding: 14px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-sub-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #38bdf8;
      font-weight: 600;
    }

    .param-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .param-name {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .param-input {
      width: 90px;
      background: rgba(10, 15, 29, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: #00f2fe;
      padding: 4px 8px;
      font-size: 0.8rem;
      text-align: right;
    }

    .param-checkbox {
      width: 18px;
      height: 18px;
      accent-color: #00f2fe;
      cursor: pointer;
    }

    .pulse-btn {
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
      padding: 12px;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .pulse-btn:hover {
      box-shadow: 0 0 30px rgba(0, 242, 254, 0.6);
    }

    /* Column Right */
    .code-and-stats-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .stats-card {
      padding: 18px 22px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .stats-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }

    .stats-header h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0;
    }

    .sim-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      font-family: monospace;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
    }

    @media (max-width: 800px) {
      .metrics-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .metric-box {
      background: rgba(0, 0, 0, 0.3);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metric-lbl {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .metric-val {
      font-size: 1.1rem;
      font-weight: 700;
      font-family: monospace;
    }

    .text-bullish { color: #10b981; }
    .text-bearish { color: #f43f5e; }
    .text-cyan { color: #00f2fe; }
    .text-gold { color: #f59e0b; }
    .text-white { color: #ffffff; }

    /* Code Editor */
    .editor-card {
      border-radius: 16px;
      background: rgba(10, 15, 29, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      background: rgba(15, 23, 42, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .editor-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .file-name {
      font-size: 0.85rem;
      color: #38bdf8;
      font-weight: 600;
    }

    .tag-version {
      font-size: 0.7rem;
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.2);
      color: #00f2fe;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }

    .editor-buttons {
      display: flex;
      gap: 8px;
    }

    .code-container {
      padding: 12px;
      background: #060913;
    }

    .code-textarea {
      width: 100%;
      height: 420px;
      background: transparent;
      border: none;
      outline: none;
      color: #e2e8f0;
      font-size: 0.85rem;
      line-height: 1.6;
      resize: vertical;
      font-family: 'Fira Code', 'Consolas', monospace;
      white-space: pre;
    }

    .guide-footer {
      padding: 14px 18px;
      background: rgba(15, 23, 42, 0.6);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .guide-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #00f2fe;
      margin-bottom: 6px;
    }

    .guide-steps {
      margin: 0;
      padding-left: 18px;
      font-size: 0.78rem;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .guide-steps strong {
      color: #e2e8f0;
    }

    /* Library View */
    .library-view {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .library-header {
      padding: 20px 24px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.7);
    }

    .library-header h3 {
      font-size: 1.25rem;
      margin: 0 0 4px 0;
      color: #f1f5f9;
    }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #94a3b8;
    }

    .scripts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .script-card {
      padding: 18px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease;
    }

    .script-card:hover {
      border-color: rgba(0, 242, 254, 0.3);
      transform: translateY(-2px);
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sym-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge-sym {
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(0, 242, 254, 0.15);
      color: #00f2fe;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(0, 242, 254, 0.3);
    }

    .badge-tf {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .badge-type {
      font-size: 0.65rem;
      background: rgba(147, 51, 234, 0.15);
      color: #c084fc;
      border: 1px solid rgba(147, 51, 234, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .btn-icon-del {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .btn-icon-del:hover {
      color: #f43f5e;
      background: rgba(244, 63, 94, 0.1);
    }

    .script-card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #f8fafc;
      margin: 0;
    }

    .script-card-desc {
      font-size: 0.8rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: rgba(0, 0, 0, 0.2);
      padding: 8px;
      border-radius: 8px;
    }

    .c-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .c-lbl {
      font-size: 0.65rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .c-val {
      font-size: 0.85rem;
      font-weight: 700;
      font-family: monospace;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    /* Shared Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      color: #030b1e;
      font-weight: 600;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
    }

    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .btn-save {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #ffffff;
      font-weight: 600;
    }

    .btn-xs {
      padding: 5px 10px;
      font-size: 0.75rem;
      border-radius: 6px;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
    }

    .flex-center {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(3, 11, 30, 0.3);
      border-top-color: #030b1e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .mono {
      font-family: 'Fira Code', 'Consolas', monospace;
    }
  `]
})
export class PineScriptStudioComponent implements OnInit {
  activeTab: 'generator' | 'library' = 'generator';

  presets: PineScriptPreset[] = [];
  selectedPresetId = 'TIMESFM_NEURAL_BANDS';
  currentPreset?: PineScriptPreset;

  selectedSymbol = 'TATASIL';
  quickSymbols = ['TATASIL', 'RELIANCE', 'NIFTY 50', 'HDFCBANK', 'TCS', 'INFY'];
  selectedTimeframe = '15m';
  selectedScriptType = 'strategy';

  dynamicInputs: Record<string, any> = {};

  isGenerating = false;
  isSaving = false;
  copyBtnText = 'Copy Code';

  currentScript?: PineScriptItem;
  currentCode = '';

  savedScripts: PineScriptItem[] = [];

  constructor(
    private tradeApi: TradeApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadPresets();
    this.loadSavedScripts();

    // Check query params for symbol or preset
    this.route.queryParams.subscribe(params => {
      if (params['symbol']) {
        this.selectedSymbol = params['symbol'].toUpperCase();
      }
      if (params['preset']) {
        this.selectedPresetId = params['preset'];
      }
    });
  }

  loadPresets(): void {
    this.tradeApi.getPineScriptPresets().subscribe(presets => {
      this.presets = presets;
      this.onPresetChange();
      // Auto-generate initial script
      this.generateScript();
    });
  }

  loadSavedScripts(): void {
    this.tradeApi.getSavedPineScripts().subscribe(scripts => {
      this.savedScripts = scripts;
    });
  }

  onPresetChange(): void {
    this.currentPreset = this.presets.find(p => p.id === this.selectedPresetId);
    if (this.currentPreset) {
      this.selectedTimeframe = this.currentPreset.timeframe || this.currentPreset.recommended_timeframe || '15m';
      this.selectedScriptType = this.currentPreset.script_type || this.currentPreset.category?.toLowerCase() || 'strategy';
      this.dynamicInputs = { ...(this.currentPreset.sample_inputs || this.currentPreset.default_params || {}) };
    }
  }

  generateScript(): void {
    this.isGenerating = true;
    this.tradeApi.generatePineScript({
      symbol: this.selectedSymbol,
      strategy_preset: this.selectedPresetId,
      script_type: this.selectedScriptType,
      timeframe: this.selectedTimeframe,
      pine_version: 'v5',
      inputs: this.dynamicInputs
    }).subscribe({
      next: script => {
        this.currentScript = script;
        this.currentCode = script.code;
        this.isGenerating = false;
      },
      error: err => {
        console.error('Pine Script generation error', err);
        this.isGenerating = false;
      }
    });
  }

  saveScriptToDb(): void {
    if (!this.currentScript) return;
    this.isSaving = true;

    this.tradeApi.savePineScript({
      title: this.currentScript.title,
      symbol: this.selectedSymbol,
      script_type: this.selectedScriptType,
      strategy_preset: this.selectedPresetId,
      timeframe: this.selectedTimeframe,
      pine_version: this.currentScript.pine_version || 'v5',
      code: this.currentCode,
      description: this.currentScript.description,
      inputs: this.dynamicInputs,
      backtest_stats: this.currentScript.backtest_stats
    }).subscribe({
      next: saved => {
        this.isSaving = false;
        this.loadSavedScripts();
        alert(`Successfully saved "${saved.title}" to your TradeAI Pine Library!`);
      },
      error: err => {
        console.error('Error saving Pine Script', err);
        this.isSaving = false;
      }
    });
  }

  copyCodeToClipboard(): void {
    if (!this.currentCode) return;
    navigator.clipboard.writeText(this.currentCode).then(() => {
      this.copyBtnText = 'Copied!';
      setTimeout(() => {
        this.copyBtnText = 'Copy Code';
      }, 2500);
    });
  }

  downloadPineFile(): void {
    if (!this.currentCode) return;
    const blob = new Blob([this.currentCode], { type: 'text/plain;charset=utf-8' });
    const filename = `${this.selectedSymbol || 'Strategy'}_${this.selectedPresetId}_${this.selectedTimeframe}.pine`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  loadSavedScript(item: PineScriptItem): void {
    this.currentScript = item;
    this.currentCode = item.code;
    this.selectedSymbol = item.symbol;
    this.selectedTimeframe = item.timeframe;
    this.selectedScriptType = item.script_type;
    this.selectedPresetId = item.strategy_preset;
    this.dynamicInputs = { ...(item.inputs || {}) };
    this.activeTab = 'generator';
  }

  deleteSavedScript(id: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!id) return;
    if (!confirm('Are you sure you want to delete this saved Pine Script?')) return;
    this.tradeApi.deletePineScript(id).subscribe(() => {
      this.savedScripts = this.savedScripts.filter(s => s.id !== id);
    });
  }

  getDownloadUrl(id: string | undefined): string {
    return id ? this.tradeApi.downloadPineScriptUrl(id) : '#';
  }

  // Template Helpers
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  formatParamKey(key: string): string {
    return key.replace(/_/g, ' ').toUpperCase();
  }

  isNumber(val: any): boolean {
    return typeof val === 'number';
  }

  isString(val: any): boolean {
    return typeof val === 'string';
  }

  isBoolean(val: any): boolean {
    return typeof val === 'boolean';
  }
}
