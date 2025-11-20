import {Routes} from '@angular/router';

export const workspacesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./workspace-list/workspace-list.component').then((m) => m.WorkspaceListComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./workspaces-create/workspaces-create.component').then((m) => m.WorkspacesCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./workspace-detail/workspace-detail.component').then((m) => m.WorkspaceDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./workspace-edit/workspace-edit.component').then((m) => m.WorkspaceEditComponent),
  },
  {
    path: ':id/members',
    loadComponent: () => import('./workspaces-members/workspaces-members.component').then((m) => m.WorkspacesMembersComponent),
  },
];
