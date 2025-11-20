import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {WorkspacesService} from '../../../core/services/workspaces.service';
import {Workspace, WorkspaceRequest} from '../../../core/models/interfaces';
import {WorkspaceTypeEnum, VisibilityEnum} from '../../../core/models/enums';
import {NotificationService} from '../../../core/services/notification.service';

@Component({
  selector: 'app-workspace-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './workspace-edit.component.html',
})
export class WorkspaceEditComponent implements OnInit {
  workspaceForm: FormGroup;
  workspace = signal<Workspace | null>(null);
  workspaceId = signal('');
  loading = signal(false);
  submitting = signal(false);
  error = signal('');

  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  workspaceTypes = Object.values(WorkspaceTypeEnum);
  visibilityOptions = Object.values(VisibilityEnum);

  constructor(
    private fb: FormBuilder,
    private workspacesService: WorkspacesService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    this.workspaceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      slug: ['', [Validators.required, Validators.pattern(/^[-a-zA-Z0-9_]+$/), Validators.maxLength(100)]],
      description: [''],
      workspace_type: ['', Validators.required],
      visibility: ['public', Validators.required],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
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
        this.workspaceForm.patchValue({
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description || '',
          workspace_type: workspace.workspace_type,
          visibility: workspace.visibility,
          is_active: workspace.is_active,
        });

        if (workspace.cover_image_url) {
          this.imagePreview.set(workspace.cover_image_url);
        }

        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load workspace');
        this.loading.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('File size must be less than 5MB');
        return;
      }

      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }

  autoGenerateSlug(): void {
    const name = this.workspaceForm.get('name')?.value;
    if (name) {
      const slug = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/--+/g, '-');
      this.workspaceForm.patchValue({slug});
    }
  }

  onSubmit(): void {
    if (this.workspaceForm.invalid) {
      Object.keys(this.workspaceForm.controls).forEach((key) => {
        this.workspaceForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const formValue = this.workspaceForm.value;

    if (this.selectedFile()) {
      const formData = new FormData();
      formData.append('name', formValue.name);
      formData.append('slug', formValue.slug);
      formData.append('description', formValue.description || '');
      formData.append('workspace_type', formValue.workspace_type);
      formData.append('visibility', formValue.visibility);
      formData.append('is_active', formValue.is_active ? 'true' : 'false');
      formData.append('cover_image', this.selectedFile()!, this.selectedFile()!.name);

      this.workspacesService.updateWorkspace(this.workspaceId(), formData).subscribe({
        next: () => {
          this.notificationService.success('Workspace updated successfully');
          this.router.navigate(['/workspaces', this.workspaceId()]);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Failed to update workspace');
          this.submitting.set(false);
        },
      });
    } else {
      const updateData: Partial<WorkspaceRequest> = {
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description || '',
        workspace_type: formValue.workspace_type as any,
        visibility: formValue.visibility as any,
        is_active: formValue.is_active,
      };

      this.workspacesService.updateWorkspace(this.workspaceId(), updateData).subscribe({
        next: () => {
          this.notificationService.success('Workspace updated successfully');
          this.router.navigate(['/workspaces', this.workspaceId()]);
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Failed to update workspace');
          this.submitting.set(false);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/workspaces', this.workspaceId()]);
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
      'other': 'Other',
    };
    return labels[type] || type;
  }

  hasError(field: string): boolean {
    const control = this.workspaceForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.workspaceForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) return `${field} is required`;
    if (control.hasError('maxLength')) return `${field} is too long`;
    if (control.hasError('pattern')) return `${field} contains invalid characters`;

    return '';
  }
}
