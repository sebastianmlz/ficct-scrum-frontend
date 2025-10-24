import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IssueService } from '../../../../core/services/issue.service';
import { IssueType, IssueRequest } from '../../../../core/models/interfaces';
import { PaginatedIssueTypeList } from '../../../../core/models/api-interfaces';

@Component({
  selector: 'app-issue-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './issue-create.component.html',
  styleUrl: './issue-create.component.css'
})
export class IssueCreateComponent {
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() issueCreated = new EventEmitter<void>();

  private issueService = inject(IssueService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  issueTypes = signal<IssueType[]>([]);
  issuesTypes = signal<PaginatedIssueTypeList | null>(null);

  issueForm: FormGroup;

  constructor() {
    this.issueForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      issue_type: ['', Validators.required],
      priority: ['P3'],
      estimated_hours: [0],
      story_points: [0]
    });
  }

  ngOnInit(): void {
    this.loadIssueTypes();
  }

  async loadIssueTypes(): Promise<void> {
    try {
      console.log('[ISSUE CREATE] Loading issue types for project:', this.projectId);
      
      // ✅ CRITICAL FIX: Filter issue types by project
      const types = await this.issueService.getIssueTypes(this.projectId).toPromise();
      
      if (types) {
        console.log('[ISSUE CREATE] ✅ Issue types loaded:', types.results.length);
        this.issuesTypes.set(types);
        this.issueTypes.set(types.results || []);
        
        if (types.results.length === 0) {
          console.warn('[ISSUE CREATE] ⚠️ No issue types found for project:', this.projectId);
          this.error.set('No issue types available for this project');
        }
      }
    } catch (error) {
      console.error('[ISSUE CREATE] ❌ Error loading issue types:', error);
      this.error.set('Error al cargar los tipos de issue');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.issueForm.valid) {
      this.loading.set(true);
      this.error.set(null);

      try {
        const formData = this.issueForm.value;
        const issueData: IssueRequest = {
          project: this.projectId,
          issue_type: formData.issue_type,
          title: formData.title,
          description: formData.description || '',
          priority: formData.priority,
          estimated_hours: formData.estimated_hours || 0,
          story_points: formData.story_points || 0
        };

        await this.issueService.createIssue(issueData).toPromise();
        this.issueCreated.emit();
      } catch (error) {
        console.error('Error creating issue:', error);
        this.error.set('Error al crear la issue');
      } finally {
        this.loading.set(false);
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
