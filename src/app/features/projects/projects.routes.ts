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
    loadComponent: () => import('./project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
    children: [
      // GitHub Integration routes
      {
        path: 'github',
        loadComponent: () => import('./components/github-integration/github-integration.component').then(m => m.GitHubIntegrationComponent)
      },
      {
        path: 'commits',
        loadComponent: () => import('./components/commits-list/commits-list.component').then(m => m.CommitsListComponent)
      },
      {
        path: 'pull-requests',
        loadComponent: () => import('./components/pull-requests-list/pull-requests-list.component').then(m => m.PullRequestsListComponent)
      },
      {
        path: 'metrics',
        loadComponent: () => import('./components/metrics-dashboard/metrics-dashboard.component').then(m => m.MetricsDashboardComponent)
      },
      // Diagram Generation routes
      {
        path: 'diagrams/workflow',
        loadComponent: () => import('./components/workflow-diagram/workflow-diagram.component').then(m => m.WorkflowDiagramComponent)
      },
      {
        path: 'diagrams/dependencies',
        loadComponent: () => import('./components/dependency-graph/dependency-graph.component').then(m => m.DependencyGraphComponent)
      },
      {
        path: 'diagrams/roadmap',
        loadComponent: () => import('./components/roadmap-timeline/roadmap-timeline.component').then(m => m.RoadmapTimelineComponent)
      },
      {
        path: 'diagrams/uml',
        loadComponent: () => import('./components/uml-diagram/uml-diagram.component').then(m => m.UMLDiagramComponent)
      },
      {
        path: 'diagrams/architecture',
        loadComponent: () => import('./components/architecture-diagram/architecture-diagram.component').then(m => m.ArchitectureDiagramComponent)
      }
    ]
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
  },
  {
    path: ':id/boards',
    loadChildren: () => import('../boards/boards.routes').then(m => m.boardsRoutes)
  }
];
