import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Project, ProjectRequest, Workspace } from '../../../core/models/interfaces';
import { ProjectStatusEnum, ProjectPriorityEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-edit.component.html',
})
export class ProjectEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private workspaceService = inject(WorkspaceService);

  projectId: string = '';
  loading = signal(true);
  saving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  workspaces = signal<Workspace[]>([]);
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  currentCoverUrl = signal<string | null>(null);

  projectStatuses = [
    { value: ProjectStatusEnum.PLANNING, label: 'Planning' },
    { value: ProjectStatusEnum.ACTIVE, label: 'Active' },
    { value: ProjectStatusEnum.ON_HOLD, label: 'On Hold' },
    { value: ProjectStatusEnum.COMPLETED, label: 'Completed' },
    { value: ProjectStatusEnum.CANCELLED, label: 'Cancelled' }
  ];

  projectPriorities = [
    { value: ProjectPriorityEnum.LOW, label: 'Low' },
    { value: ProjectPriorityEnum.MEDIUM, label: 'Medium' },
    { value: ProjectPriorityEnum.HIGH, label: 'High' },
    { value: ProjectPriorityEnum.CRITICAL, label: 'Critical' }
  ];

  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    workspace: ['', [Validators.required]],
    description: [''],
    status: [ProjectStatusEnum.PLANNING],
    priority: [ProjectPriorityEnum.MEDIUM],
    start_date: [''],
    due_date: [''],
    budget: [''],
    estimated_hours: [''],
    is_active: [true]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadWorkspaces();
        this.loadProject();
      }
    });
  }

  async loadWorkspaces(): Promise<void> {
    try {
      // TODO: Need to implement organization-specific workspace loading
      // For now, set empty array to prevent errors
      this.workspaces.set([]);
      
      // const response = await this.workspaceService.getWorkspaces(organizationId).toPromise();
      // if (response) {
      //   this.workspaces.set(response.results);
      // }
    } catch (error: any) {
      console.error('Failed to load workspaces:', error);
    }
  }

  async loadProject(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const project = await this.projectService.getProject(this.projectId).toPromise();
      if (project) {
        this.populateForm(project);
        this.currentCoverUrl.set(project.cover_image_url || null);
      }
    } catch (error: any) {
      this.loadError.set(error.error?.message || 'Failed to load project');
    } finally {
      this.loading.set(false);
    }
  }

  populateForm(project: Project): void {
    // Format dates for HTML date input (YYYY-MM-DD)
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      return dateString.split('T')[0];
    };

    this.projectForm.patchValue({
      name: project.name,
      slug: project.slug,
      workspace: project.workspace.id,
      description: project.description,
      status: project.status,
      priority: project.priority,
      start_date: formatDate(project.start_date),
      due_date: formatDate(project.due_date),
      budget: project.budget,
      estimated_hours: project.estimated_hours,
      is_active: project.is_active
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.successMessage.set(null);

    try {
      const formData: ProjectRequest = {
        name: this.projectForm.value.name,
        slug: this.projectForm.value.slug,
        workspace: this.projectForm.value.workspace,
        description: this.projectForm.value.description || undefined,
        status: this.projectForm.value.status,
        priority: this.projectForm.value.priority,
        start_date: this.projectForm.value.start_date || undefined,
        due_date: this.projectForm.value.due_date || undefined,
        budget: this.projectForm.value.budget || undefined,
        estimated_hours: this.projectForm.value.estimated_hours || undefined,
        is_active: this.projectForm.value.is_active,
        cover_image: this.selectedFile || undefined
      };

      const project = await this.projectService.updateProject(this.projectId, formData).toPromise();
      if (project) {
        this.successMessage.set('Project updated successfully!');
        this.currentCoverUrl.set(project.cover_image_url || null);
        this.selectedFile = null;
        this.previewUrl = null;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      }
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to update project');
    } finally {
      this.saving.set(false);
    }
  }
}
