import { Routes } from '@angular/router';

export const workspacesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./workspaces-list/workspaces-list.component').then(m => m.WorkspacesListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./workspaces-create/workspaces-create.component').then(m => m.WorkspacesCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./workspaces-detail/workspaces-detail.component').then(m => m.WorkspacesDetailComponent)
  },
  {
    path: ':id/members',
    loadComponent: () => import('./workspaces-members/workspaces-members.component').then(m => m.WorkspacesMembersComponent)
  }
];
