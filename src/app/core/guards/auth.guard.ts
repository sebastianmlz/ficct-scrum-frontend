import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {CanActivateFn} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {AuthStore} from '../store/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const hasToken = authService.isLoggedIn();
  const isAuthenticated = authStore.isAuthenticated();

  console.log('AuthGuard check:', {hasToken, isAuthenticated});

  if (hasToken) {
    // If user has token but AuthStore is not initialized, initialize it
    if (!isAuthenticated) {
      console.log('AuthGuard: Token exists but AuthStore not initialized, ' +
        'initializing...');
      authStore.initializeAuth();
    }
    return true;
  } else {
    console.log('AuthGuard: User not authenticated, redirecting to login');
    router.navigate(['/auth/login'], {queryParams: {returnUrl: state.url}});
    return false;
  }
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  } else {
    console.log(
        'GuestGuard: User already authenticated, redirecting to dashboard');
    router.navigate(['/dashboard']);
    return false;
  }
};
