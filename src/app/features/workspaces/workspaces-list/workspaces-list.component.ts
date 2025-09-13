import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkspaceService, Workspace, WorkspaceListResponse } from '../../../core/services/workspace.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { FormsModule } from '@angular/forms';

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
    FormsModule
  ],
  templateUrl: './workspaces-list.component.html',
  styleUrl: './workspaces-list.component.css'
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
  
  // Búsqueda
  searchTerm = '';

  constructor(
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.organizationId.set(params['organization'] || '');
      if (this.organizationId()) {
        this.loadWorkspaces();
      }
    });
  }

  loadWorkspaces() {
    this.loading.set(true);
    this.error.set('');
    
    this.workspaceService.getWorkspaces(
      this.organizationId(), 
      this.currentPage(), 
      this.searchTerm || undefined
    ).subscribe({
      next: (response: WorkspaceListResponse) => {
        this.workspaces.set(response.results);
        this.totalRecords.set(response.count);
        this.loading.set(false);
        
        // Obtener nombre de organización del primer workspace
        if (response.results.length > 0) {
          this.organizationName.set(response.results[0].organization.name);
        }
      },
      error: (err) => {
        this.error.set('Error loading workspaces: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadWorkspaces();
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadWorkspaces();
  }

  createWorkspace() {
    this.router.navigate(['/workspaces/create'], { 
      queryParams: { organization: this.organizationId() } 
    });
  }

  viewWorkspace(workspace: Workspace) {
    this.router.navigate(['/workspaces', workspace.id]);
  }

  getVisibilityClass(visibility: string): string {
    return visibility === 'public' ? 'success' : 'info';
  }

  getTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'development': 'Desarrollo',
      'design': 'Diseño',
      'marketing': 'Marketing',
      'sales': 'Ventas',
      'support': 'Soporte',
      'hr': 'Recursos Humanos',
      'finance': 'Finanzas',
      'general': 'General'
    };
    return types[type] || type;
  }
}
