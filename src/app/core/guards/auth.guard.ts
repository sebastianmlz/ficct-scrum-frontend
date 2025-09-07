import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthStore } from '../store/auth.store';

export const authGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Try to get a valid token (this will refresh if needed)
  const validToken = await authStore.getValidToken();
  
  if (validToken && authStore.isLoggedIn()) {
    return true;
  }

  // Redirect to login page with return url
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};

export const guestGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Check if user has valid token
  const validToken = await authStore.getValidToken();
  
  if (!validToken || !authStore.isLoggedIn()) {
    return true;
  }

  // Get return URL from query params or default to dashboard
  const returnUrl = route.queryParams?.['returnUrl'] || '/dashboard';
  router.navigate([returnUrl]);
  return false;
};
