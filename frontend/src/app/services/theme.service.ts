import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<ThemeMode>('dark');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem('tradeai_theme') as ThemeMode;
    const initialTheme: ThemeMode = saved === 'light' ? 'light' : 'dark';
    this.setTheme(initialTheme);
  }

  get isDarkMode(): boolean {
    return this.currentThemeSubject.value === 'dark';
  }

  toggleTheme(): void {
    const next = this.currentThemeSubject.value === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: ThemeMode): void {
    this.currentThemeSubject.next(theme);
    localStorage.setItem('tradeai_theme', theme);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('dark-theme', 'light-theme');
      document.body.classList.add(`${theme}-theme`);
    }
  }
}
