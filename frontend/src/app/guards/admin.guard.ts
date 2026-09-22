import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn && !authService.getToken()) {
    authService.openAuthModal('login');
    return false;
  }

  const user = authService.currentUserValue;
  if (user && user.role === 'admin') {
    return true;
  }

  // Not an admin -> redirect to home
  router.navigate(['/']);
  return false;
};
