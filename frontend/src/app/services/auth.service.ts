import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { UserProfile, AuthResponse } from '../models/trade.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:8000/api/auth';
  private readonly tokenKey = 'tradeai_jwt_token';
  private readonly userKey = 'tradeai_user_profile';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private authModalOpenSubject = new BehaviorSubject<{ open: boolean; tab: 'login' | 'signup' }>({
    open: false,
    tab: 'login'
  });
  public authModalOpen$ = this.authModalOpenSubject.asObservable();

  constructor(private http: HttpClient) {
    // If token exists, verify & refresh profile from backend
    if (this.getToken()) {
      this.refreshProfile().subscribe({
        error: () => {
          // If token expired or invalid, keep existing local storage or clear
        }
      });
    }
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public get currentUserValue(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  public get isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'admin';
  }

  public openAuthModal(tab: 'login' | 'signup' = 'login'): void {
    this.authModalOpenSubject.next({ open: true, tab });
  }

  public closeAuthModal(): void {
    this.authModalOpenSubject.next({ open: false, tab: 'login' });
  }

  public login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public signup(payload: { username: string; email: string; password: string; full_name: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public refreshProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      })
    );
  }

  public updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, profile).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      })
    );
  }

  public refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, {}).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  public logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.baseUrl}/logout`, {}).pipe(
        catchError(() => of(null))
      ).subscribe();
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.openAuthModal('login');
  }

  public setCurrentUser(user: UserProfile): void {
    this.currentUserSubject.next(user);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private handleAuthSuccess(res: AuthResponse): void {
    if (res && res.token) {
      localStorage.setItem(this.tokenKey, res.token);
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
      this.currentUserSubject.next(res.user);
      this.closeAuthModal();
    }
  }

  private getStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(this.userKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error parsing stored user', e);
    }
    return null;
  }
}
