import {Routes} from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component')
          .then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'logs',
    loadComponent: () =>
      import('./logs/logs.component').then((m) => m.LogsComponent),
  },
  {
    path: 'logs/system',
    loadComponent: () =>
      import('./logs/logs.component').then((m) => m.LogsComponent),
  },
  {
    path: 'logs/errors',
    loadComponent: () => import('./error-logs/error-logs.component')
        .then((m) => m.ErrorLogsComponent),
  },
  {
    path: 'sync-pinecone',
    loadComponent: () =>
      import('./sync-pinecone-manager/sync-pinecone-manager.component')
          .then((m) => m.SyncPineconeManagerComponent),
  },
];
