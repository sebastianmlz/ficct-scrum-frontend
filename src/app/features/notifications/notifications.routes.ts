import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const notificationsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./notification-list/notification-list.component').then(m => m.NotificationListComponent),
        title: 'Notifications'
      },
      {
        path: 'preferences',
        loadComponent: () => import('./notification-preferences/notification-preferences.component').then(m => m.NotificationPreferencesComponent),
        title: 'Notification Preferences'
      }
    ]
  }
];
