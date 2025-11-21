import {Component, EventEmitter, Input, Output, inject, signal, OnInit}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {IssueService} from '../../../../core/services/issue.service';
import {IssueType, Issue, IssueRequest}
  from '../../../../core/models/interfaces';
import {PaginatedIssueTypeList} from '../../../../core/models/api-interfaces';

@Component({
  selector: 'app-issue-edit',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './issue-edit.component.html',
  styleUrl: './issue-edit.component.css',
})
export class IssueEditComponent implements OnInit {
  @Input() issueId!: string;
  @Output() closeE = new EventEmitter<void>();
  @Output() issueUpdated = new EventEmitter<void>();

  private issueService = inject(IssueService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  issueTypes = signal<IssueType[]>([]);
  issuesTypes = signal<PaginatedIssueTypeList | null>(null);
  issue = signal<Issue | null>(null);

  issueForm: FormGroup;

  constructor() {
    this.issueForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      issue_type: ['', Validators.required],
      priority: ['P3'],
      estimated_hours: [0],
      actual_hours: [0],
      story_points: [0],
    });
  }

  ngOnInit(): void {
    // Load issue first to get projectId, load issue types filtered by project
    this.loadIssue();
  }

  async loadIssueTypes(projectId: string): Promise<void> {
    try {
      console.log('[ISSUE EDIT] Loading issue types for project:', projectId);

      // ✅ CRITICAL FIX: Filter issue types by project
      const types = await this.issueService.getIssueTypes(projectId)
          .toPromise();

      if (types) {
        console.log('[ISSUE EDIT] ✅ Issue types loaded:', types.results.length);
        this.issuesTypes.set(types);
        this.issueTypes.set(types.results || []);

        if (types.results.length === 0) {
          console.warn('[ISSUE EDIT] ⚠️ No issue types found for project:',
              projectId);
          this.error.set('No issue types available for this project');
        }
      }
    } catch (error) {
      console.error('[ISSUE EDIT] ❌ Error loading issue types:', error);
      this.error.set('Error al cargar los tipos de issue');
    }
  }

  async loadIssue(): Promise<void> {
    this.loading.set(true);
    try {
      console.log('[ISSUE EDIT] Loading issue:', this.issueId);
      const issueData = await this.issueService.getIssue(this.issueId)
          .toPromise();

      if (issueData) {
        console.log('[ISSUE EDIT] ✅ Issue loaded:', issueData);
        this.issue.set(issueData);

        // ✅ CRITICAL: Load issue types filtered by project
        const projectId = issueData.project?.id;
        if (projectId) {
          console.log('[ISSUE EDIT] Project ID from issue:', projectId);
          await this.loadIssueTypes(projectId);
        } else {
          console.error('[ISSUE EDIT] ❌ Issue has no project ID');
        }

        // Llenar el formulario con los datos de la issue
        this.issueForm.patchValue({
          title: issueData.title,
          description: issueData.description || '',
          issue_type: issueData.issue_type?.id || '',
          priority: issueData.priority,
          estimated_hours: issueData.estimated_hours || 0,
          actual_hours: issueData.actual_hours || 0,
          story_points: issueData.story_points || 0,
        });
      }
    } catch (error) {
      console.error('[ISSUE EDIT] ❌ Error loading issue:', error);
      this.error.set('Error al cargar la issue');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.issueForm.valid) {
      this.loading.set(true);
      this.error.set(null);

      try {
        const formData = this.issueForm.value;
        const issueData: Partial<IssueRequest> = {
          title: formData.title,
          description: formData.description || '',
          issue_type: formData.issue_type,
          priority: formData.priority,
          estimated_hours: formData.estimated_hours || 0,
          actual_hours: formData.actual_hours || 0,
          story_points: formData.story_points || 0,
        };

        await this.issueService.editIssue(this.issueId, issueData).toPromise();
        this.issueUpdated.emit();
      } catch (error) {
        console.error('Error updating issue:', error);
        this.error.set('Error al actualizar la issue');
      } finally {
        this.loading.set(false);
      }
    }
  }

  onClose(): void {
    this.closeE.emit();
  }
}
