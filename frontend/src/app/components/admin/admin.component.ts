import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { AdminStatsResponse, AdminUserItem, AuditLogItem } from '../../models/trade.models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-dashboard-container">
      <!-- Admin Hero & Telemetry Header -->
      <div class="admin-header glass-panel">
        <div class="header-content">
          <div class="header-badge">
            <span class="shield-icon">🛡️</span>
            <span>CENTRAL COMMAND & RBAC</span>
          </div>
          <h1 class="page-title">Admin Management <span class="gradient-text">Panel</span></h1>
          <p class="page-desc">
            Monitor registered traders, manage user roles, audit platform operations, and enforce security policies.
          </p>
        </div>
        <div class="header-actions">
          <button class="action-btn primary" (click)="openCreateUserModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add New User</span>
          </button>
          <button class="action-btn secondary" (click)="loadAllData()" [disabled]="isLoading">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Live KPI Metrics Row -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card glass-panel">
          <div class="stat-icon-wrap user-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-details">
            <span class="stat-title">TOTAL REGISTERED</span>
            <span class="stat-value mono">{{ stats.total_users }}</span>
            <span class="stat-sub text-bullish">{{ stats.active_users }} active accounts</span>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon-wrap admin-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div class="stat-details">
            <span class="stat-title">ADMIN PRIVILEGES</span>
            <span class="stat-value mono">{{ stats.admin_users }}</span>
            <span class="stat-sub text-accent">Full Access Granted</span>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon-wrap trade-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="stat-details">
            <span class="stat-title">TOTAL EXECUTED TRADES</span>
            <span class="stat-value mono">{{ stats.total_trades }}</span>
            <span class="stat-sub text-bullish">{{ stats.total_positions }} active open positions</span>
          </div>
        </div>

        <div class="stat-card glass-panel">
          <div class="stat-icon-wrap db-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
            </svg>
          </div>
          <div class="stat-details">
            <span class="stat-title">DATABASE BACKEND</span>
            <span class="stat-value mono">{{ stats.database_dialect }}</span>
            <span class="stat-sub text-bullish">● {{ stats.system_status }}</span>
          </div>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      <div class="toast-message" *ngIf="toastMessage" [ngClass]="toastType">
        <span>{{ toastMessage }}</span>
      </div>

      <!-- Main Section: User Management & RBAC Controls -->
      <div class="admin-section glass-panel">
        <div class="section-top">
          <div class="section-title-wrap">
            <h2 class="section-title">User Accounts & Role Permissions</h2>
            <span class="count-pill mono">{{ filteredUsers.length }} Users</span>
          </div>

          <!-- Filter & Search Controls -->
          <div class="controls-row">
            <div class="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (input)="filterUsers()" 
                placeholder="Search by username, email, full name..." 
              />
            </div>

            <div class="filter-group">
              <select [(ngModel)]="selectedRole" (change)="filterUsers()" class="custom-select">
                <option value="ALL">All Roles</option>
                <option value="user">Traders (User)</option>
                <option value="admin">Administrators</option>
              </select>

              <select [(ngModel)]="selectedStatus" (change)="filterUsers()" class="custom-select">
                <option value="ALL">All Status</option>
                <option value="active">Active Accounts</option>
                <option value="inactive">Suspended Accounts</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>USER / PROFILE</th>
                <th>ROLE ACCESS</th>
                <th>ACCOUNT STATUS</th>
                <th>RISK PROFILE</th>
                <th>WATCHLIST</th>
                <th>BALANCE</th>
                <th>JOINED</th>
                <th class="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers" [class.inactive-row]="!u.is_active">
                <td>
                  <div class="user-cell">
                    <img [src]="u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'" alt="Avatar" class="table-avatar" />
                    <div>
                      <div class="user-fullname">{{ u.full_name }}</div>
                      <div class="user-sub mono">{{ u.email }} · <span>@{{ u.username }}</span></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="role-selector">
                    <select 
                      [ngModel]="u.role" 
                      (ngModelChange)="changeUserRole(u, $event)"
                      [class.role-admin]="u.role === 'admin'"
                      [class.role-user]="u.role === 'user'"
                      class="role-badge-select"
                    >
                      <option value="user">👤 USER</option>
                      <option value="admin">👑 ADMIN</option>
                    </select>
                  </div>
                </td>
                <td>
                  <button 
                    class="status-pill" 
                    [class.active]="u.is_active" 
                    [class.suspended]="!u.is_active"
                    (click)="toggleUserStatus(u)"
                    [title]="u.is_active ? 'Click to Suspend Account' : 'Click to Reactivate Account'"
                  >
                    <span class="status-dot"></span>
                    <span>{{ u.is_active ? 'Active' : 'Suspended' }}</span>
                  </button>
                </td>
                <td>
                  <span class="risk-badge mono">{{ u.risk_tolerance }}</span>
                </td>
                <td>
                  <span class="mono">{{ u.watchlist_count }} Assets</span>
                </td>
                <td>
                  <span class="mono font-semibold">₹{{ u.portfolio_balance | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="text-muted text-xs mono">{{ u.created_at || 'Recent' }}</span>
                </td>
                <td class="text-right">
                  <div class="row-actions">
                    <button class="delete-btn" (click)="deleteUser(u)" title="Delete User" [disabled]="u.id === currentAdminId">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredUsers.length === 0">
                <td colspan="8" class="empty-cell">
                  <div class="empty-state">
                    <span>🔍 No user accounts match your search filters.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Audit Log Trail Section -->
      <div class="admin-section glass-panel">
        <div class="section-top">
          <div class="section-title-wrap">
            <h2 class="section-title">Security & Operations Audit Trail</h2>
            <span class="count-pill mono">Live Events</span>
          </div>
        </div>

        <div class="audit-log-list">
          <div *ngFor="let log of auditLogs" class="audit-item">
            <div class="audit-badge" [ngClass]="getAuditActionClass(log.action)">
              {{ log.action }}
            </div>
            <div class="audit-info">
              <span class="audit-desc">{{ log.details || log.action }}</span>
              <span class="audit-meta mono">
                By: <strong>{{ log.username || 'System' }}</strong> · IP: {{ log.ip_address || '127.0.0.1' }} · {{ log.created_at }}
              </span>
            </div>
          </div>

          <div *ngIf="auditLogs.length === 0" class="empty-cell">
            <span>No audit logs recorded yet.</span>
          </div>
        </div>
      </div>

      <!-- Create User Modal -->
      <div class="modal-backdrop" *ngIf="showCreateModal" (click)="closeCreateModal()">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Provision New User Account</h3>
            <button class="modal-close" (click)="closeCreateModal()">✕</button>
          </div>

          <form (ngSubmit)="submitCreateUser()" class="create-form">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="newUser.full_name" name="fn" required placeholder="Jane Doe" />
              </div>
              <div class="form-group">
                <label>Username</label>
                <input type="text" [(ngModel)]="newUser.username" name="un" required placeholder="janedoe" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="newUser.email" name="em" required placeholder="jane@tradeai.app" />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="newUser.password" name="pw" required placeholder="••••••••" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Role Assignment</label>
                <select [(ngModel)]="newUser.role" name="rl" class="custom-select">
                  <option value="user">Standard Trader (User)</option>
                  <option value="admin">Platform Administrator (Admin)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Risk Tolerance</label>
                <select [(ngModel)]="newUser.risk_tolerance" name="rt" class="custom-select">
                  <option value="CONSERVATIVE">CONSERVATIVE</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="AGGRESSIVE">AGGRESSIVE</option>
                </select>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="action-btn secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="action-btn primary" [disabled]="!newUser.email || !newUser.password || !newUser.username">
                Provision User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard-container {
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px 20px 80px 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .admin-header {
      padding: 28px 32px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      border: 1px solid rgba(0, 242, 254, 0.2);
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 242, 254, 0.1);
      border: 1px solid rgba(0, 242, 254, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #00f2fe;
      margin-bottom: 8px;
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }
    .page-desc {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.9rem;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .action-btn.primary {
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      color: #06090e;
    }
    .action-btn.primary:hover {
      box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
      transform: translateY(-1px);
    }
    .action-btn.secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fff;
    }
    .action-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .stat-card {
      padding: 20px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon-wrap.user-icon { background: rgba(0, 242, 254, 0.15); color: #00f2fe; }
    .stat-icon-wrap.admin-icon { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .stat-icon-wrap.trade-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .stat-icon-wrap.db-icon { background: rgba(168, 85, 247, 0.15); color: #a855f7; }

    .stat-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-secondary, #94a3b8);
      letter-spacing: 0.5px;
      display: block;
    }
    .stat-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: #fff;
      display: block;
      margin: 2px 0;
    }
    .stat-sub {
      font-size: 0.75rem;
    }

    .admin-section {
      padding: 24px;
      border-radius: 16px;
    }
    .section-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }
    .count-pill {
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #00f2fe;
    }

    .controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 0 12px;
      height: 38px;
      min-width: 280px;
    }
    .search-input-wrap input {
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: 0.85rem;
      width: 100%;
    }
    .filter-group {
      display: flex;
      gap: 8px;
    }
    .custom-select {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #fff;
      border-radius: 8px;
      height: 38px;
      padding: 0 10px;
      font-size: 0.8rem;
      outline: none;
    }

    .table-container {
      overflow-x: auto;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .users-table th {
      text-align: left;
      padding: 12px 14px;
      color: var(--text-secondary, #94a3b8);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .users-table td {
      padding: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }
    .inactive-row {
      opacity: 0.6;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .table-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .user-fullname {
      font-weight: 700;
      color: #fff;
    }
    .user-sub {
      font-size: 0.75rem;
      color: var(--text-secondary, #94a3b8);
    }

    .role-badge-select {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;
    }
    .role-badge-select.role-admin {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.4);
    }
    .role-badge-select.role-user {
      background: rgba(0, 242, 254, 0.1);
      color: #00f2fe;
      border-color: rgba(0, 242, 254, 0.3);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .status-pill.active {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .status-pill.suspended {
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
      border-color: rgba(244, 63, 94, 0.3);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .risk-badge {
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .delete-btn {
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      color: #f43f5e;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .delete-btn:hover:not(:disabled) {
      background: rgba(244, 63, 94, 0.25);
      border-color: #f43f5e;
    }
    .delete-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .audit-log-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 360px;
      overflow-y: auto;
    }
    .audit-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .audit-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      font-family: var(--font-mono);
      white-space: nowrap;
    }
    .badge-login { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    .badge-signup { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-role { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .badge-trade { background: rgba(168, 85, 247, 0.2); color: #c084fc; }
    .badge-status { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

    .audit-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .audit-desc {
      font-size: 0.8rem;
      color: #fff;
    }
    .audit-meta {
      font-size: 0.7rem;
      color: var(--text-secondary, #94a3b8);
    }

    .toast-message {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      animation: fadeIn 0.2s ease;
    }
    .toast-message.success {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }
    .toast-message.error {
      background: rgba(244, 63, 94, 0.2);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fb7185;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }
    .modal-card {
      background: #0d1117;
      border: 1px solid rgba(0, 242, 254, 0.3);
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      padding: 28px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-secondary, #94a3b8);
      font-size: 1.2rem;
      cursor: pointer;
    }
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .form-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary, #94a3b8);
      margin-bottom: 6px;
    }
    .form-group input, .form-group select {
      width: 100%;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      height: 40px;
      padding: 0 12px;
      color: #fff;
      font-size: 0.85rem;
      outline: none;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
    }
    .empty-cell {
      text-align: center;
      padding: 30px;
      color: var(--text-secondary, #94a3b8);
    }
    .text-right { text-align: right; }
    .text-accent { color: #f59e0b; }
  `]
})
export class AdminComponent implements OnInit {
  stats: AdminStatsResponse | null = null;
  users: AdminUserItem[] = [];
  filteredUsers: AdminUserItem[] = [];
  auditLogs: AuditLogItem[] = [];

  searchQuery = '';
  selectedRole = 'ALL';
  selectedStatus = 'ALL';

  isLoading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  showCreateModal = false;
  newUser = {
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    is_active: true,
    risk_tolerance: 'MODERATE'
  };

  currentAdminId = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const current = this.authService.currentUserValue;
    if (current) {
      this.currentAdminId = current.id;
    }
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.adminService.getStats().subscribe({
      next: (s) => this.stats = s,
      error: (e) => console.error('Failed to load stats', e)
    });

    this.adminService.getUsers().subscribe({
      next: (u) => {
        this.users = u;
        this.filterUsers();
        this.isLoading = false;
      },
      error: (e) => {
        console.error('Failed to load users', e);
        this.isLoading = false;
      }
    });

    this.adminService.getAuditLogs().subscribe({
      next: (logs) => this.auditLogs = logs,
      error: (e) => console.error('Failed to load audit logs', e)
    });
  }

  filterUsers(): void {
    let list = [...this.users];
    if (this.selectedRole !== 'ALL') {
      list = list.filter(u => u.role === this.selectedRole);
    }
    if (this.selectedStatus === 'active') {
      list = list.filter(u => u.is_active);
    } else if (this.selectedStatus === 'inactive') {
      list = list.filter(u => !u.is_active);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(u => 
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q)
      );
    }
    this.filteredUsers = list;
  }

  changeUserRole(user: AdminUserItem, newRole: 'user' | 'admin'): void {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (updated) => {
        user.role = updated.role;
        this.showToast(`Updated ${user.username}'s role to ${newRole.toUpperCase()}`, 'success');
        this.loadAllData();
      },
      error: (err) => {
        this.showToast(err?.error?.detail || 'Failed to update role', 'error');
      }
    });
  }

  toggleUserStatus(user: AdminUserItem): void {
    const nextStatus = !user.is_active;
    this.adminService.updateUserStatus(user.id, nextStatus).subscribe({
      next: (updated) => {
        user.is_active = updated.is_active;
        this.showToast(`${user.username} account ${nextStatus ? 'Activated' : 'Suspended'}`, 'success');
        this.loadAllData();
      },
      error: (err) => {
        this.showToast(err?.error?.detail || 'Failed to update user status', 'error');
      }
    });
  }

  deleteUser(user: AdminUserItem): void {
    if (!confirm(`Are you sure you want to permanently delete user "${user.username}"?`)) {
      return;
    }
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.showToast(`User ${user.username} removed successfully`, 'success');
        this.loadAllData();
      },
      error: (err) => {
        this.showToast(err?.error?.detail || 'Failed to delete user', 'error');
      }
    });
  }

  openCreateUserModal(): void {
    this.newUser = {
      full_name: '',
      username: '',
      email: '',
      password: '',
      role: 'user',
      is_active: true,
      risk_tolerance: 'MODERATE'
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  submitCreateUser(): void {
    this.adminService.createUser(this.newUser).subscribe({
      next: (created) => {
        this.showToast(`User ${created.username} created successfully!`, 'success');
        this.closeCreateModal();
        this.loadAllData();
      },
      error: (err) => {
        this.showToast(err?.error?.detail || 'Failed to create user', 'error');
      }
    });
  }

  getAuditActionClass(action: string): string {
    const a = action.toUpperCase();
    if (a.includes('LOGIN')) return 'badge-login';
    if (a.includes('SIGNUP') || a.includes('CREATE')) return 'badge-signup';
    if (a.includes('ROLE')) return 'badge-role';
    if (a.includes('TRADE')) return 'badge-trade';
    return 'badge-status';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }
}
