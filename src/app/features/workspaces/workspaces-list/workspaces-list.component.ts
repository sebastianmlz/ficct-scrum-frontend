import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {WorkspaceService, Workspace, WorkspaceListResponse} from '../../../core/services/workspace.service';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {PaginatorModule} from 'primeng/paginator';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-workspaces-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    TagModule,
    PaginatorModule,
    FormsModule,
  ],
  templateUrl: './workspaces-list.component.html',
  styleUrl: './workspaces-list.component.css',
})
export class WorkspacesListComponent implements OnInit {
  workspaces = signal<Workspace[]>([]);
  loading = signal(false);
  error = signal('');
  organizationId = signal('');
  organizationName = signal('');

  // Paginación
  totalRecords = signal(0);
  currentPage = signal(1);
  rowsPerPage = 10;

  // Búsqueda y filtros
  searchTerm = '';
  typeFilter = '';
  sortBy = 'created_at';

  constructor(
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.organizationId.set(params['organization'] || '');
      if (this.organizationId()) {
        this.loadWorkspaces();
      }
    });
  }

  loadWorkspaces() {
    this.loading.set(true);
    this.error.set('');

    // Simulación de filtros, deberías adaptar esto a tu API si soporta filtros
    this.workspaceService.getWorkspaces(
        this.organizationId(),
        this.currentPage(),
        this.searchTerm || undefined,
        // Si tu API soporta type y sort, pásalos aquí
        // this.typeFilter || undefined,
        // this.sortBy || undefined
    ).subscribe({
      next: (response: WorkspaceListResponse) => {
        let normalizedWorkspaces = (response.results || []).map((ws: any) => ({
          ...ws,
          organization: {
            id: ws.organization?.id || '',
            name: ws.organization?.name || '',
            slug: ws.organization?.slug || '',
            logo_url: ws.organization?.logo_url || '',
            organization_type: ws.organization?.organization_type || '',
            subscription_plan: ws.organization?.subscription_plan || '',
            is_active: ws.organization?.is_active ?? true,
          },
        }));
        // Filtro local por tipo
        if (this.typeFilter) {
          normalizedWorkspaces = normalizedWorkspaces.filter((ws) => ws.workspace_type === this.typeFilter);
        }
        // Orden local
        if (this.sortBy === 'created_at') {
          normalizedWorkspaces = normalizedWorkspaces.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (this.sortBy === '-created_at') {
          normalizedWorkspaces = normalizedWorkspaces.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else if (this.sortBy === 'name') {
          normalizedWorkspaces = normalizedWorkspaces.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === '-name') {
          normalizedWorkspaces = normalizedWorkspaces.sort((a, b) => b.name.localeCompare(a.name));
        }
        this.workspaces.set(normalizedWorkspaces);
        this.totalRecords.set(normalizedWorkspaces.length);
        this.loading.set(false);

        if (normalizedWorkspaces.length > 0) {
          this.organizationName.set(normalizedWorkspaces[0].organization.name);
        }
      },
      error: (err) => {
        this.error.set('Error loading workspaces: ' + (err.error?.message || err.message));
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadWorkspaces();
  }

  // Filtros
  onTypeFilterChange() {
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  onSortChange() {
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  createWorkspace() {
    this.router.navigate(['/workspaces/create'], {
      queryParams: {organization: this.organizationId()},
    });
  }

  viewWorkspace(workspace: Workspace) {
    this.router.navigate(['/workspaces', workspace.id]);
  }

  getVisibilityClass(visibility: string): string {
    return visibility === 'public' ? 'success' : 'info';
  }

  getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'development': 'Desarrollo',
      'design': 'Diseño',
      'marketing': 'Marketing',
      'sales': 'Ventas',
      'support': 'Soporte',
      'hr': 'Recursos Humanos',
      'finance': 'Finanzas',
      'general': 'General',
    };
    return types[type] || type;
  }
}
