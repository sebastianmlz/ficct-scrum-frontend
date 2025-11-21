import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {WorkspaceService, Workspace}
  from '../../../core/services/workspace.service';

@Component({
  selector: 'app-workspaces-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workspaces-detail.component.html',
  styleUrl: './workspaces-detail.component.css',
})
export class WorkspacesDetailComponent implements OnInit {
  workspace = signal<Workspace | null>(null);
  loading = signal(false);
  error = signal('');
  workspaceId = signal('');
  objectKeys = Object.keys;

  private workspaceService = inject(WorkspaceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.workspaceId.set(params['id']);
      if (this.workspaceId()) {
        this.loadWorkspace();
      }
    });
  }

  loadWorkspace() {
    this.loading.set(true);
    this.error.set('');

    this.workspaceService.getWorkspace(this.workspaceId()).subscribe({
      next: (workspace: any) => {
        // Adaptar organization_details a organization si es necesario
        if (workspace.organization_details) {
          workspace.organization = workspace.organization_details;
        }
        this.workspace.set(workspace);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error loading workspace: ' +
          (err.error?.message || err.message));
        this.loading.set(false);
      },
    });
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

  getVisibilityLabel(visibility: string): string {
    const vis: Record<string, string> = {
      'public': 'Público',
      'private': 'Privado',
    };
    return vis[visibility] || visibility;
  }

  goBack() {
    const orgId = this.workspace()?.organization?.id;
    if (orgId) {
      this.router.navigate(['/workspaces'],
          {queryParams: {organization: orgId}});
    } else {
      this.router.navigate(['/workspaces']);
    }
  }

  editWorkspace() {
    this.router.navigate(['/workspaces', this.workspaceId(), 'edit']);
  }

  viewProjects() {
    this.router.navigate(['/projects'],
        {queryParams: {workspace: this.workspaceId()}});
  }

  viewMembers() {
    this.router.navigate(['/workspaces', this.workspaceId(), 'members']);
  }
}
