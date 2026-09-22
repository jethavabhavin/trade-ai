import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TradeApiService } from '../../services/trade-api.service';
import { UserProfile } from '../../models/trade.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page" *ngIf="user">
      <div class="profile-card glass-panel">
        <div class="user-header">
          <img [src]="user.avatar_url" alt="Avatar" class="avatar-large" />
          <div class="user-info">
            <h1 class="user-name">{{ user.full_name }}</h1>
            <span class="user-handle mono">&#64;{{ user.username }} • {{ user.email }}</span>
            <span class="badge badge-ai" style="width: fit-content; margin-top: 6px;">
              PRO SUBSCRIBER (9 AM AI PREDICTIONS ACTIVE)
            </span>
          </div>
        </div>

        <div class="settings-form">
          <div class="section-title">
            <h3>Trading & AI Signal Preferences</h3>
            <p class="section-desc">Customize morning pre-market alerts and automated recommendation risk profiles.</p>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Risk Tolerance</label>
              <select class="form-select mono" [(ngModel)]="user.risk_tolerance">
                <option value="CONSERVATIVE">Conservative (Low Drawdown, High Cap Only)</option>
                <option value="MODERATE">Moderate (Balanced Index & Large Cap ETFs)</option>
                <option value="AGGRESSIVE">Aggressive (High Momentum, Growth & Tata Metals)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Morning Pre-Market Alert Timing</label>
              <select class="form-select mono" [(ngModel)]="user.morning_alert_time">
                <option value="08:15 AM">08:15 AM (Early Morning Pre-Market Scan)</option>
                <option value="08:30 AM">08:30 AM (Standard Pre-Market Digest)</option>
                <option value="08:45 AM">08:45 AM (Immediate 30-min Before Open)</option>
                <option value="09:00 AM">09:00 AM (Sharp at Opening Prep)</option>
              </select>
            </div>
          </div>

          <div class="toggle-group">
            <label class="toggle-container">
              <input type="checkbox" [(ngModel)]="user.enable_push_notifications" />
              <span class="toggle-slider"></span>
              <span class="toggle-label">Enable Instant Push / WhatsApp Notification for 9:00 AM BUY/SELL Signals</span>
            </label>
          </div>

          <div class="btn-row">
            <button class="btn btn-primary" (click)="saveProfile()">
              Save Preferences
            </button>
            <span class="save-status" *ngIf="savedNotice">✓ Preferences saved successfully!</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      display: flex;
      justify-content: center;
      padding-bottom: 40px;
    }

    .profile-card {
      width: 100%;
      max-width: 780px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #00f2fe;
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .user-handle {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-title h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .section-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
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

    .form-select {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }

    .toggle-group {
      padding: 12px 0;
    }

    .toggle-container {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .btn-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
    }

    .save-status {
      color: #10b981;
      font-size: 0.875rem;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .user-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  savedNotice: boolean = false;

  constructor(private api: TradeApiService) {}

  ngOnInit(): void {
    this.api.currentUser$.subscribe(u => {
      this.user = { ...u };
    });
  }

  saveProfile(): void {
    if (!this.user) return;
    this.api.updateProfile(this.user).subscribe(() => {
      this.savedNotice = true;
      setTimeout(() => this.savedNotice = false, 3000);
    });
  }
}
