import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, RouterLink, ActivatedRoute} from '@angular/router';
import {ProjectService} from '../../../core/services/project.service';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {ProjectRequest, Workspace} from '../../../core/models/interfaces';
import {ProjectStatusEnum, ProjectPriorityEnum, MethodologyEnum} from '../../../core/models/enums';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-create.component.html',
})
export class ProjectCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private workspaceService = inject(WorkspaceService);

  loading = signal(false);
  error = signal<string | null>(null);
  workspaces = signal<Workspace[]>([]);
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  projectStatuses = [
    {value: ProjectStatusEnum.PLANNING, label: 'Planning'},
    {value: ProjectStatusEnum.ACTIVE, label: 'Active'},
    {value: ProjectStatusEnum.ON_HOLD, label: 'On Hold'},
    {value: ProjectStatusEnum.COMPLETED, label: 'Completed'},
    {value: ProjectStatusEnum.CANCELLED, label: 'Cancelled'},
  ];

  projectPriorities = [
    {value: ProjectPriorityEnum.LOW, label: 'Low'},
    {value: ProjectPriorityEnum.MEDIUM, label: 'Medium'},
    {value: ProjectPriorityEnum.HIGH, label: 'High'},
    {value: ProjectPriorityEnum.CRITICAL, label: 'Critical'},
  ];

  projectMethodology = [
    {value: MethodologyEnum.SCRUM, label: 'Scrum'},
    {value: MethodologyEnum.KANBAN, label: 'Kanban'},
    {value: MethodologyEnum.HYBRID, label: 'Hybrid'},
  ];


  projectForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: [''],
    key: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    workspace: ['', [Validators.required]],
    methodology: [MethodologyEnum.SCRUM, [Validators.required]],
    description: [''],
    status: [ProjectStatusEnum.PLANNING],
    priority: [ProjectPriorityEnum.MEDIUM],
    start_date: [''],
    end_date: [''],
    budget: [''],
    estimated_hours: [''],
    is_active: [true],
  });

  constructor() {
    // Auto-generate key from name
    this.projectForm.get('name')?.valueChanges.subscribe((name) => {
      if (name && !this.projectForm.get('key')?.touched) {
        const key = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        this.projectForm.patchValue({key});
      }
    });
  }

  ngOnInit(): void {
    this.loadWorkspaces();

    // Check if workspace is pre-selected via query param
    this.route.queryParams.subscribe((params) => {
      if (params['workspace']) {
        this.projectForm.patchValue({workspace: params['workspace']});
      }
    });
  }

  async loadWorkspaces(): Promise<void> {
    const organizationId = this.route.snapshot.queryParamMap.get('organization') || undefined;
    try {
      const response = await this.workspaceService.getWorkspaces(organizationId).toPromise();
      const workspacesRaw = Array.isArray(response) ?
        response :
        response?.results || [];

      const workspaces = workspacesRaw.map((ws: any) => ({
        ...ws,
        organization: {
          ...(ws.organization_details || {}),
          logo_url: ws.organization_details?.logo_url || '',
          subscription_plan: ws.organization_details?.subscription_plan || '',
          is_active: ws.organization_details?.is_active ?? true,
        },
      }));
      this.workspaces.set(workspaces);
      console.log('Workspaces loaded:', workspaces);
    } catch (error: any) {
      this.error.set('Failed to load workspaces');
    }
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

    this.loading.set(true);
    this.error.set(null);

    try {
      const formData: ProjectRequest = {
        name: this.projectForm.value.name,
        slug: this.projectForm.value.slug,
        key: this.projectForm.value.key,
        workspace: this.projectForm.value.workspace,
        methodology: this.projectForm.value.methodology,
        description: this.projectForm.value.description || undefined,
        status: this.projectForm.value.status,
        priority: this.projectForm.value.priority,
        start_date: this.projectForm.value.start_date || undefined,
        end_date: this.projectForm.value.end_date || undefined,
        budget: this.projectForm.value.budget || undefined,
        estimated_hours: this.projectForm.value.estimated_hours || undefined,
        is_active: this.projectForm.value.is_active,
        cover_image: this.selectedFile || undefined,
      };
      console.log('datos enviados al backend:', formData);

      const project = await this.projectService.createProject(formData).toPromise();
      if (project) {
        this.router.navigate(['/projects', project.id]);
      }
    } catch (error: any) {
      console.log('Error:', error);
      this.error.set(error.error?.message || 'Failed to create project');
    } finally {
      this.loading.set(false);
    }
  }
}
