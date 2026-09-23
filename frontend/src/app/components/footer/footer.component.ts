import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="main-footer glass-panel">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="brand-title">Trade<span class="gradient-text">AI</span></div>
          <p class="brand-desc">
            Next-generation neural time-series forecasting & pre-market 9:00 AM BUY/SELL recommendation engine.
          </p>
        </div>

        <div class="footer-links-group">
          <div class="link-col">
            <span class="col-head">Core Navigation</span>
            <a routerLink="/">Dashboard</a>
            <a routerLink="/stock/TATASIL">Stock Analytics</a>
            <a routerLink="/watchlist">Watchlist</a>
            <a routerLink="/portfolio">Paper Trading</a>
          </div>

          <div class="link-col">
            <span class="col-head">Pre-Market AI</span>
            <a routerLink="/" fragment="morning-signals">9:00 AM Calls</a>
            <a routerLink="/profile">Alert Preferences</a>
            <a href="http://localhost:8000/docs" target="_blank">FastAPI Backend Docs</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="disclaimer">
          <strong>Disclaimer:</strong> TradeAI provides algorithmically synthesized time-series forecasting models and market sentiment signals for informational and educational simulation purposes. Always perform your own research before placing live capital in financial markets.
        </p>
        <span class="copy-text mono">© 2026 TradeAI Platform. All rights reserved.</span>
      </div>
    </footer>
  `,
  styles: [`
    .main-footer {
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-bottom: none;
      padding: 32px 24px 80px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-top: auto;
      background: #06090e;
    }

    .footer-top {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
    }

    .footer-brand {
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .brand-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .footer-links-group {
      display: flex;
      gap: 48px;
      flex-wrap: wrap;
    }

    .link-col {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.8125rem;
    }

    .col-head {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .link-col a {
      color: var(--text-secondary);
      transition: color 0.15s ease;
    }
    .link-col a:hover {
      color: #00f2fe;
    }

    .footer-bottom {
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .disclaimer {
      font-size: 0.6875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .copy-text {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .footer-top {
        flex-direction: column;
      }
      .footer-links-group {
        gap: 28px;
      }
    }
  `]
})
export class FooterComponent {}
