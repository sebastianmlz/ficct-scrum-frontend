
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Authentication routes (accessible only to guests)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      // reset-password sin token (formulario manual)
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      // reset-password con token en la URL (desde email)
      {
        path: 'reset-password/:token',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Protected dashboard route
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Organizations routes (protected)
  {
    path: 'organizations',
    canActivate: [authGuard],
    loadChildren: () => import('./features/organizations/organizations.routes').then(m => m.organizationsRoutes)
  },

  // Workspaces routes (protected)
  {
    path: 'workspaces',
    canActivate: [authGuard],
    loadChildren: () => import('./features/workspaces/workspaces.routes').then(m => m.workspacesRoutes)
  },

  // Projects routes (protected)
  {
    path: 'projects',
    canActivate: [authGuard],
    loadChildren: () => import('./features/projects/projects.routes').then(m => m.projectsRoutes)
  },

  // Admin routes (protected)
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },

  // Profile routes (protected)
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes)
  },

  // Notifications routes (protected)
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadChildren: () => import('./features/notifications/notifications.routes').then(m => m.notificationsRoutes)
  },

  // Redirección global para enlaces externos de reset-password
  {
    path: 'reset-password/:token',
    redirectTo: '/auth/reset-password/:token',
    pathMatch: 'full'
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
