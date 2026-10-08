import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn || authService.getToken()) {
    return true;
  }

  // Not logged in -> only open popup modal if navigating to a specific sub-route from within app
  if (state.url && state.url !== '/' && state.url !== '') {
    authService.openAuthModal('login');
  }
  return false;
};
