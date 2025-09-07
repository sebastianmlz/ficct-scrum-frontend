import { Routes } from '@angular/router';

export const organizationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./organizations-list/organizations-list.component').then(m => m.OrganizationsListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./organization-create/organization-create.component').then(m => m.OrganizationCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./organization-detail/organization-detail.component').then(m => m.OrganizationDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./organization-edit/organization-edit.component').then(m => m.OrganizationEditComponent)
  },
  {
    path: ':id/members',
    loadComponent: () => import('./organization-members/organization-members.component').then(m => m.OrganizationMembersComponent)
  }
];
