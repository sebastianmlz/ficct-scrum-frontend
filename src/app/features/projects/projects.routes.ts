import { Routes } from '@angular/router';

export const projectsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./projects-list/projects-list.component').then(m => m.ProjectsListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./project-create/project-create.component').then(m => m.ProjectCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./project-edit/project-edit.component').then(m => m.ProjectEditComponent)
  },
  {
    path: ':id/config',
    loadComponent: () => import('./project-config/project-config.component').then(m => m.ProjectConfigComponent)
  },
  {
    path: ':id/config-create',
    loadComponent: () => import('./project-config-create/project-config-create.component').then(m => m.ProjectConfigCreateComponent)
  },
  {
    path: ':id/issues',
    loadComponent: () => import('./project-issues/issue-list/issue-list.component').then(m => m.IssueListComponent)
  }
];
