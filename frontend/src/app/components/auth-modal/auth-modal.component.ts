import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="closeOnBackdrop($event)">
      <div class="auth-modal-card glass-panel" (click)="$event.stopPropagation()">
        <!-- Close Button -->
        <button class="close-btn" (click)="close()" title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Brand Header -->
        <div class="auth-header">
          <div class="logo-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h2 class="auth-title">Trade<span class="gradient-text">AI</span> Terminal</h2>
          <p class="auth-subtitle">AI-Driven 9:00 AM Pre-Market Forecast & Execution Platform</p>
        </div>

        <!-- Quick 1-Click Demo Logins -->
        <div class="quick-demo-section">
          <div class="quick-demo-label">⚡ 1-CLICK QUICK ACCESS</div>
          <div class="demo-buttons-row">
            <button class="demo-btn admin-demo" (click)="quickLogin('admin')" [disabled]="isLoading">
              <span class="demo-icon">👑</span>
              <div class="demo-meta">
                <strong>Admin Staff</strong>
                <small>Role: Full RBAC Control</small>
              </div>
            </button>
            <button class="demo-btn trader-demo" (click)="quickLogin('trader')" [disabled]="isLoading">
              <span class="demo-icon">📈</span>
              <div class="demo-meta">
                <strong>Trader Pro</strong>
                <small>Role: Standard User</small>
              </div>
            </button>
          </div>
        </div>

        <div class="divider-row">
          <span>OR SIGN IN WITH CREDENTIALS</span>
        </div>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'login'" 
            (click)="activeTab = 'login'; errorMessage = ''"
          >
            Sign In
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab === 'signup'" 
            (click)="activeTab = 'signup'; errorMessage = ''"
          >
            Create Account
          </button>
        </div>

        <!-- Error / Feedback Alert -->
        <div class="alert-box error" *ngIf="errorMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <div class="alert-box success" *ngIf="successMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{{ successMessage }}</span>
        </div>

        <!-- Login Form -->
        <form *ngIf="activeTab === 'login'" (ngSubmit)="submitLogin()" class="auth-form">
          <div class="form-group">
            <label>Email Address</label>
            <div class="input-wrap">
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
            <div class="input-wrap">
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

          <button type="submit" class="submit-btn" [disabled]="isLoading || !loginEmail || !loginPassword">
            <span *ngIf="!isLoading">Authorize & Enter Terminal</span>
            <span *ngIf="isLoading" class="loading-state">
              <span class="spinner"></span> Authenticating...
            </span>
          </button>
        </form>

        <!-- Signup Form -->
        <form *ngIf="activeTab === 'signup'" (ngSubmit)="submitSignup()" class="auth-form">
          <div class="form-group">
            <label>Full Name</label>
            <div class="input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                [(ngModel)]="signupFullName" 
                name="signupFullName" 
                placeholder="e.g. John Doe" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label>Username</label>
            <div class="input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
              </svg>
              <input 
                type="text" 
                [(ngModel)]="signupUsername" 
                name="signupUsername" 
                placeholder="e.g. alphatrader" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <div class="input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                type="email" 
                [(ngModel)]="signupEmail" 
                name="signupEmail" 
                placeholder="john@example.com" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label>Password (min 6 chars)</label>
            <div class="input-wrap">
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

          <button type="submit" class="submit-btn" [disabled]="isLoading || !signupEmail || !signupPassword || !signupUsername">
            <span *ngIf="!isLoading">Create Account & Get 9 AM Forecasts</span>
            <span *ngIf="isLoading" class="loading-state">
              <span class="spinner"></span> Creating Account...
            </span>
          </button>
        </form>

        <div class="security-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>End-to-End JWT Session & bcrypt Security</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
      padding: 16px;
    }

    .auth-modal-card {
      background: rgba(13, 17, 23, 0.95);
      border: 1px solid rgba(0, 242, 254, 0.3);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.15);
      border-radius: 18px;
      width: 100%;
      max-width: 480px;
      padding: 32px;
      position: relative;
      color: var(--text-primary, #fff);
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-secondary, #94a3b8);
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .close-btn:hover {
      background: rgba(244, 63, 94, 0.15);
      border-color: rgba(244, 63, 94, 0.4);
      color: #f43f5e;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 70, 229, 0.3));
      border: 1px solid rgba(0, 242, 254, 0.4);
      color: #00f2fe;
      margin-bottom: 12px;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.25);
    }
    .auth-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .auth-subtitle {
      font-size: 0.8rem;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
    }

    .quick-demo-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 20px;
    }
    .quick-demo-label {
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #00f2fe;
      margin-bottom: 8px;
      text-align: center;
    }
    .demo-buttons-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .demo-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
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
    .demo-icon {
      font-size: 1.25rem;
    }
    .demo-meta strong {
      display: block;
      font-size: 0.8rem;
      color: #fff;
    }
    .demo-meta small {
      display: block;
      font-size: 0.65rem;
      color: var(--text-secondary, #94a3b8);
    }

    .divider-row {
      text-align: center;
      position: relative;
      margin: 16px 0;
    }
    .divider-row::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      z-index: 1;
    }
    .divider-row span {
      position: relative;
      z-index: 2;
      background: #0d1117;
      padding: 0 12px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: var(--text-muted, #64748b);
    }

    .auth-tabs {
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

    .auth-form {
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
    .input-wrap {
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
    .input-wrap:focus-within {
      border-color: #00f2fe;
      box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
    }
    .input-wrap svg {
      color: var(--text-muted, #64748b);
    }
    .input-wrap input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: 0.85rem;
    }
    .input-wrap input::placeholder {
      color: rgba(255, 255, 255, 0.25);
    }

    .submit-btn {
      margin-top: 8px;
      height: 44px;
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      border: none;
      border-radius: 10px;
      color: #06090e;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(0, 242, 254, 0.35);
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .alert-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 14px;
    }
    .alert-box.error {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: #fb7185;
    }
    .alert-box.success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }

    .security-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 20px;
      font-size: 0.7rem;
      color: var(--text-muted, #64748b);
    }

    .spinner {
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
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class AuthModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  activeTab: 'login' | 'signup' = 'login';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Form inputs
  loginEmail = 'trader@tradeai.app';
  loginPassword = 'TraderPassword@123';

  signupFullName = '';
  signupUsername = '';
  signupEmail = '';
  signupPassword = '';

  private sub?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.sub = this.authService.authModalOpen$.subscribe(state => {
      this.isOpen = state.open;
      this.activeTab = state.tab;
      this.errorMessage = '';
      this.successMessage = '';
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  close(): void {
    this.authService.closeAuthModal();
  }

  closeOnBackdrop(e: MouseEvent): void {
    this.close();
  }

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
        this.successMessage = `Welcome back, ${res.user.full_name}!`;
        setTimeout(() => {
          this.close();
        }, 600);
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
        this.successMessage = `Account created successfully! Welcome, ${res.user.full_name}.`;
        setTimeout(() => {
          this.close();
        }, 800);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Failed to create account. Please check your inputs.';
      }
    });
  }
}
