import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStatsResponse, AdminUserItem, AuditLogItem } from '../models/trade.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.baseUrl}/stats`);
  }

  getUsers(search?: string, role?: string, statusFilter?: string): Observable<AdminUserItem[]> {
    let url = `${this.baseUrl}/users`;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'ALL') params.append('role', role);
    if (statusFilter && statusFilter !== 'ALL') params.append('status_filter', statusFilter);

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    return this.http.get<AdminUserItem[]>(url);
  }

  createUser(user: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: string;
    is_active: boolean;
    risk_tolerance: string;
  }): Observable<AdminUserItem> {
    return this.http.post<AdminUserItem>(`${this.baseUrl}/users`, user);
  }

  updateUserRole(userId: string, role: 'user' | 'admin'): Observable<AdminUserItem> {
    return this.http.put<AdminUserItem>(`${this.baseUrl}/users/${userId}/role`, { role });
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<AdminUserItem> {
    return this.http.put<AdminUserItem>(`${this.baseUrl}/users/${userId}/status`, { is_active: isActive });
  }

  deleteUser(userId: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.baseUrl}/users/${userId}`);
  }

  getAuditLogs(limit: number = 50): Observable<AuditLogItem[]> {
    return this.http.get<AuditLogItem[]>(`${this.baseUrl}/audit-logs?limit=${limit}`);
  }
}
