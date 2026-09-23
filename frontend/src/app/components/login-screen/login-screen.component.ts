import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page-wrapper">
      <!-- Background Cyber Grid & Glow Orbs -->
      <div class="glow-orb top-left"></div>
      <div class="glow-orb bottom-right"></div>
      <div class="cyber-grid-overlay"></div>

      <div class="login-layout-container">
        <!-- Left Showcase Brand Column -->
        <div class="brand-showcase-column">
          <div class="brand-pill">
            <span class="live-dot"></span>
            <span>SECURE AI TRADING PLATFORM</span>
          </div>

          <div class="brand-hero-title">
            <h1>Trade<span class="gradient-text">AI</span> Terminal</h1>
            <p class="hero-tagline">
              Intelligent 9:00 AM Pre-Market Forecast & Neural Recommendation Engine
            </p>
          </div>

          <div class="feature-checklist">
            <div class="feature-item">
              <div class="feature-icon">🧠</div>
              <div class="feature-text">
                <strong>Google TimesFM 3.0 Foundation Model</strong>
                <span>Multi-step neural transformer forecasting for equities, ETFs & market indices</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">⏰</div>
              <div class="feature-text">
                <strong>Daily 9:00 AM Pre-Market Signals</strong>
                <span>Actionable BUY / SELL signals with target price, stop-loss & risk metrics</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">💼</div>
              <div class="feature-text">
                <strong>Real-Time Paper Trading Portfolio</strong>
                <span>Execute live market simulations with zero financial risk</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🛡️</div>
              <div class="feature-text">
                <strong>MySQL DB & Role-Based Access Control</strong>
                <span>Enterprise grade security with JWT tokens and Admin Command Center</span>
              </div>
            </div>
          </div>

          <div class="market-status-box glass-panel">
            <div class="status-indicator-row">
              <span class="pulse-dot"></span>
              <span class="status-heading">PRE-MARKET AI ENGINE STATUS</span>
            </div>
            <p class="status-sub">
              Next scheduled 9:00 AM inference cycle begins at <strong>08:45 AM IST</strong>. Please sign in to access terminal charts and live recommendations.
            </p>
          </div>
        </div>

        <!-- Right Authentication Card -->
        <div class="auth-card-column">
          <div class="auth-box glass-panel">
            <div class="auth-card-header">
              <div class="logo-shield">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <h2 class="form-title">Terminal Authorization</h2>
              <p class="form-subtitle">Enter your credentials or choose a 1-click demo persona</p>
            </div>

            <!-- 1-Click Demo Fast Logins -->
            <div class="quick-demo-banner">
              <div class="demo-heading">⚡ 1-CLICK INSTANT PERSONA ACCESS</div>
              <div class="demo-buttons-grid">
                <button 
                  type="button" 
                  class="demo-btn admin-demo" 
                  (click)="quickLogin('admin')" 
                  [disabled]="isLoading"
                >
                  <span class="demo-emoji">👑</span>
                  <div class="demo-info">
                    <strong>Admin Command</strong>
                    <small>Full RBAC & User Management</small>
                  </div>
                </button>
                <button 
                  type="button" 
                  class="demo-btn trader-demo" 
                  (click)="quickLogin('trader')" 
                  [disabled]="isLoading"
                >
                  <span class="demo-emoji">📈</span>
                  <div class="demo-info">
                    <strong>Trader Pro</strong>
                    <small>9 AM Signals & Portfolio</small>
                  </div>
                </button>
              </div>
            </div>

            <div class="or-separator">
              <span>OR ENTER CREDENTIALS</span>
            </div>

            <!-- Tabs -->
            <div class="tab-switcher">
              <button 
                type="button"
                class="tab-btn" 
                [class.active]="activeTab === 'login'" 
                (click)="activeTab = 'login'; errorMessage = ''"
              >
                Sign In
              </button>
              <button 
                type="button"
                class="tab-btn" 
                [class.active]="activeTab === 'signup'" 
                (click)="activeTab = 'signup'; errorMessage = ''"
              >
                Create Account
              </button>
            </div>

            <!-- Alerts -->
            <div class="alert-banner error" *ngIf="errorMessage">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <div class="alert-banner success" *ngIf="successMessage">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>{{ successMessage }}</span>
            </div>

            <!-- Login Form -->
            <form *ngIf="activeTab === 'login'" (ngSubmit)="submitLogin()" class="form-body">
              <div class="form-group">
                <label>Email Address</label>
                <div class="input-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input 
                    type="email" 
                    [(ngModel)]="loginEmail" 
                    name="loginEmail" 
                    placeholder="trader@tradeai.app" 
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Password</label>
                <div class="input-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input 
                    type="password" 
                    [(ngModel)]="loginPassword" 
                    name="loginPassword" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" class="submit-action-btn" [disabled]="isLoading || !loginEmail || !loginPassword">
                <span *ngIf="!isLoading">Authorize Session & Open Dashboard</span>
                <span *ngIf="isLoading" class="btn-spinner-state">
                  <span class="spinner-ring"></span> Authenticating...
                </span>
              </button>
            </form>

            <!-- Signup Form -->
            <form *ngIf="activeTab === 'signup'" (ngSubmit)="submitSignup()" class="form-body">
              <div class="form-group">
                <label>Full Name</label>
                <div class="input-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input 
                    type="text" 
                    [(ngModel)]="signupFullName" 
                    name="signupFullName" 
                    placeholder="e.g. Rahul Sharma" 
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Username</label>
                <div class="input-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
                  </svg>
                  <input 
                    type="text" 
                    [(ngModel)]="signupUsername" 
                    name="signupUsername" 
                    placeholder="e.g. rahul_trader" 
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Email Address</label>
                <div class="input-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input 
                    type="email" 
                    [(ngModel)]="signupEmail" 
                    name="signupEmail" 
                    placeholder="rahul@example.com" 
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Password (min 6 characters)</label>
                <div class="input-container">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input 
                    type="password" 
                    [(ngModel)]="signupPassword" 
                    name="signupPassword" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" class="submit-action-btn" [disabled]="isLoading || !signupEmail || !signupPassword || !signupUsername">
                <span *ngIf="!isLoading">Register Account & Get 9 AM Forecasts</span>
                <span *ngIf="isLoading" class="btn-spinner-state">
                  <span class="spinner-ring"></span> Creating Account...
                </span>
              </button>
            </form>

            <div class="security-caption">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Protected by JWT Token Architecture & SHA-256 / bcrypt Hashing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page-wrapper {
      min-height: 100vh;
      width: 100vw;
      background: #06090e;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 30px 20px;
    }

    .cyber-grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(0, 242, 254, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 242, 254, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
    }
    .glow-orb.top-left {
      top: -100px;
      left: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%);
    }
    .glow-orb.bottom-right {
      bottom: -150px;
      right: -150px;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%);
    }

    .login-layout-container {
      width: 100%;
      max-width: 1180px;
      display: grid;
      grid-template-columns: 1.15fr 0.95fr;
      gap: 50px;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    /* Brand Column */
    .brand-showcase-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 242, 254, 0.08);
      border: 1px solid rgba(0, 242, 254, 0.3);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #00f2fe;
      width: fit-content;
      letter-spacing: 0.5px;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 8px #00f2fe;
      animation: pulseGlow 1.5s infinite;
    }

    .brand-hero-title h1 {
      font-size: 2.85rem;
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1.1;
      margin: 0 0 10px 0;
    }
    .hero-tagline {
      font-size: 1.1rem;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
      line-height: 1.5;
    }

    .feature-checklist {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 10px 0;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 12px 16px;
      border-radius: 12px;
      transition: border-color 0.2s ease;
    }
    .feature-item:hover {
      border-color: rgba(0, 242, 254, 0.3);
    }
    .feature-icon {
      font-size: 1.4rem;
      line-height: 1;
    }
    .feature-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .feature-text strong {
      font-size: 0.9rem;
      color: #fff;
    }
    .feature-text span {
      font-size: 0.8rem;
      color: var(--text-secondary, #94a3b8);
    }

    .market-status-box {
      padding: 16px 20px;
      border-radius: 14px;
      border: 1px solid rgba(0, 242, 254, 0.2);
    }
    .status-indicator-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .status-heading {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #10b981;
    }
    .status-sub {
      font-size: 0.8rem;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
      line-height: 1.4;
    }
    .status-sub strong {
      color: #00f2fe;
    }

    /* Right Auth Box */
    .auth-box {
      background: rgba(13, 17, 23, 0.92);
      border: 1px solid rgba(0, 242, 254, 0.35);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.12);
      border-radius: 20px;
      padding: 36px 32px;
      backdrop-filter: blur(16px);
    }

    .auth-card-header {
      text-align: center;
      margin-bottom: 22px;
    }
    .logo-shield {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 70, 229, 0.3));
      border: 1px solid rgba(0, 242, 254, 0.4);
      color: #00f2fe;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.25);
    }
    .form-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .form-subtitle {
      font-size: 0.825rem;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
    }

    .quick-demo-banner {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 18px;
    }
    .demo-heading {
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #00f2fe;
      text-align: center;
      margin-bottom: 8px;
    }
    .demo-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .demo-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      background: rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      text-align: left;
    }
    .demo-btn.admin-demo:hover {
      background: rgba(245, 158, 11, 0.15);
      border-color: rgba(245, 158, 11, 0.5);
    }
    .demo-btn.trader-demo:hover {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.5);
    }
    .demo-emoji {
      font-size: 1.25rem;
    }
    .demo-info strong {
      display: block;
      font-size: 0.78rem;
      color: #fff;
    }
    .demo-info small {
      display: block;
      font-size: 0.65rem;
      color: var(--text-secondary, #94a3b8);
    }

    .or-separator {
      text-align: center;
      position: relative;
      margin: 16px 0;
    }
    .or-separator::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      z-index: 1;
    }
    .or-separator span {
      position: relative;
      z-index: 2;
      background: #0d1117;
      padding: 0 12px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--text-muted, #64748b);
    }

    .tab-switcher {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 20px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary, #94a3b8);
      padding: 8px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn.active {
      background: rgba(0, 242, 254, 0.15);
      color: #00f2fe;
      border: 1px solid rgba(0, 242, 254, 0.3);
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary, #94a3b8);
      margin-bottom: 6px;
    }
    .input-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 0 12px;
      height: 42px;
      transition: border-color 0.2s ease;
    }
    .input-container:focus-within {
      border-color: #00f2fe;
      box-shadow: 0 0 12px rgba(0, 242, 254, 0.25);
    }
    .input-container svg {
      color: var(--text-muted, #64748b);
    }
    .input-container input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: 0.85rem;
    }
    .input-container input::placeholder {
      color: rgba(255, 255, 255, 0.25);
    }

    .submit-action-btn {
      margin-top: 8px;
      height: 46px;
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      border: none;
      border-radius: 10px;
      color: #06090e;
      font-weight: 800;
      font-size: 0.925rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .submit-action-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(0, 242, 254, 0.4);
    }
    .submit-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 14px;
    }
    .alert-banner.error {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
    }
    .alert-banner.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }

    .security-caption {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 22px;
      font-size: 0.7rem;
      color: var(--text-muted, #64748b);
    }

    .spinner-ring {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: #06090e;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 960px) {
      .login-layout-container {
        grid-template-columns: 1fr;
        gap: 32px;
      }
      .brand-hero-title h1 {
        font-size: 2.2rem;
      }
      .feature-checklist {
        display: none;
      }
    }
  `]
})
export class LoginScreenComponent {
  activeTab: 'login' | 'signup' = 'login';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  loginEmail = 'trader@tradeai.app';
  loginPassword = 'TraderPassword@123';

  signupFullName = '';
  signupUsername = '';
  signupEmail = '';
  signupPassword = '';

  constructor(private authService: AuthService) {}

  quickLogin(role: 'admin' | 'trader'): void {
    if (role === 'admin') {
      this.loginEmail = 'admin@tradeai.app';
      this.loginPassword = 'AdminPassword@123';
    } else {
      this.loginEmail = 'trader@tradeai.app';
      this.loginPassword = 'TraderPassword@123';
    }
    this.activeTab = 'login';
    this.submitLogin();
  }

  submitLogin(): void {
    if (!this.loginEmail || !this.loginPassword) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login({
      email: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = `Access Granted! Welcome ${res.user.full_name}.`;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Invalid email or password. Please try again.';
      }
    });
  }

  submitSignup(): void {
    if (!this.signupEmail || !this.signupPassword || !this.signupUsername || !this.signupFullName) {
      this.errorMessage = 'Please complete all fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.signup({
      username: this.signupUsername,
      email: this.signupEmail,
      password: this.signupPassword,
      full_name: this.signupFullName
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = `Account provisioned successfully! Loading terminal...`;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Registration failed. Please check inputs.';
      }
    });
  }
}
