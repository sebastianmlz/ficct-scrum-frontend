import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WorkspacesService } from '../../../core/services/workspaces.service';
import { Workspace } from '../../../core/models/interfaces';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workspace-detail.component.html'
})
export class WorkspaceDetailComponent implements OnInit {
  workspace = signal<Workspace | null>(null);
  loading = signal(false);
  error = signal('');
  workspaceId = signal('');
  showDeleteConfirm = signal(false);
  deleting = signal(false);

  constructor(
    private workspacesService: WorkspacesService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.workspaceId.set(params['id']);
      if (this.workspaceId()) {
        this.loadWorkspace();
      }
    });
  }

  loadWorkspace(): void {
    this.loading.set(true);
    this.error.set('');

    this.workspacesService.getWorkspace(this.workspaceId()).subscribe({
      next: (workspace: Workspace) => {
        this.workspace.set(workspace);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load workspace');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    const orgId = this.workspace()?.organization_details?.id;
    if (orgId) {
      this.router.navigate(['/workspaces'], { queryParams: { organization: orgId } });
    } else {
      this.router.navigate(['/organizations']);
    }
  }

  editWorkspace(): void {
    this.router.navigate(['/workspaces', this.workspaceId(), 'edit']);
  }

  viewProjects(): void {
    this.router.navigate(['/projects'], { queryParams: { workspace: this.workspaceId() } });
  }

  viewMembers(): void {
    this.router.navigate(['/workspaces', this.workspaceId(), 'members']);
  }

  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  deleteWorkspace(): void {
    this.deleting.set(true);
    
    this.workspacesService.deleteWorkspace(this.workspaceId()).subscribe({
      next: () => {
        this.notificationService.success('Workspace deleted successfully');
        this.goBack();
      },
      error: (err: Error) => {
        this.notificationService.error(err.message || 'Failed to delete workspace');
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'development': 'Development',
      'design': 'Design',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'support': 'Support',
      'hr': 'Human Resources',
      'finance': 'Finance',
      'general': 'General',
      'team': 'Team',
      'project': 'Project',
      'department': 'Department',
      'other': 'Other'
    };
    return labels[type] || type;
  }

  getVisibilityBadgeClass(visibility: string): string {
    const classes: Record<string, string> = {
      'public': 'bg-green-100 text-green-800',
      'private': 'bg-gray-100 text-gray-800',
      'restricted': 'bg-yellow-100 text-yellow-800'
    };
    return classes[visibility] || 'bg-gray-100 text-gray-800';
  }

  getTypeInitials(type: string): string {
    const initials: Record<string, string> = {
      'development': 'DEV',
      'design': 'DES',
      'marketing': 'MKT',
      'sales': 'SLS',
      'support': 'SUP',
      'hr': 'HR',
      'finance': 'FIN',
      'general': 'GEN',
      'team': 'TM',
      'project': 'PRJ',
      'department': 'DEPT',
      'other': 'OTH'
    };
    return initials[type] || 'WSP';
  }

  getTypeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'development': 'bg-blue-100 text-blue-800',
      'design': 'bg-purple-100 text-purple-800',
      'marketing': 'bg-pink-100 text-pink-800',
      'sales': 'bg-green-100 text-green-800',
      'support': 'bg-orange-100 text-orange-800',
      'hr': 'bg-indigo-100 text-indigo-800',
      'finance': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-gray-100 text-gray-800',
      'team': 'bg-teal-100 text-teal-800',
      'project': 'bg-cyan-100 text-cyan-800',
      'department': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  }
}
