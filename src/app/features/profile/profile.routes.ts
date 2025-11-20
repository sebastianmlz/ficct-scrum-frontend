import {Routes} from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-view/profile-view.component').then((m) => m.ProfileViewComponent),
  },
  {
    path: 'edit',
    loadComponent: () => import('./profile-edit/profile-edit.component').then((m) => m.ProfileEditComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./profile-settings/profile-settings.component').then((m) => m.ProfileSettingsComponent),
  },
];
