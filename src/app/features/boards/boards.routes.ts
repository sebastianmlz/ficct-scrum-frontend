import {Routes} from '@angular/router';

export const boardsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/board-list/board-list.component').then((m) => m.BoardListComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./components/create-board-dialog/create-board-dialog.component').then((m) => m.CreateBoardDialogComponent),
  },
  {
    path: ':boardId',
    loadComponent: () => import('./components/board-detail/board-detail.component').then((m) => m.BoardDetailComponent),
  },
];
