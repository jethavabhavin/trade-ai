import { Component, signal, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { NavMenuComponent } from './components/nav-menu/nav-menu.component';
import { SearchModalComponent } from './components/search-modal/search-modal.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { LoginScreenComponent } from './components/login-screen/login-screen.component';
import { FooterComponent } from './components/footer/footer.component';
import { AuthService } from './services/auth.service';
import { UserProfile } from './models/trade.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    NavMenuComponent,
    SearchModalComponent,
    AuthModalComponent,
    LoginScreenComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  mobileSidebarOpen = signal(false);
  currentUser = signal<UserProfile | null>(this.authService.currentUser());
  private authSub?: Subscription;

  ngOnInit(): void {
    // Sync initial state from AuthService
    this.currentUser.set(this.authService.currentUser());

    this.authSub = this.authService.currentUser$.subscribe(u => {
      this.currentUser.set(u);
      this.cdr.markForCheck();
      if (u) {
        // User logged in: ensure router activates dashboard if needed
        const url = this.router.url;
        if (!url || url === '/' || url === '/login' || !this.router.navigated) {
          this.router.navigate(['/']);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }
}
