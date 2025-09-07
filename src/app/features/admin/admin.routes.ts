import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'logs',
    children: [
      {
        path: 'system',
        loadComponent: () => import('./system-logs/system-logs.component').then(m => m.SystemLogsComponent)
      },
      {
        path: 'errors',
        loadComponent: () => import('./error-logs/error-logs.component').then(m => m.ErrorLogsComponent)
      },
      {
        path: '',
        redirectTo: 'system',
        pathMatch: 'full'
      }
    ]
  }
];
