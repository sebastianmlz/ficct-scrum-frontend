import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IssueService } from '../../../../core/services/issue.service';
import { IssueType, Issue, IssueRequest } from '../../../../core/models/interfaces';
import { PaginatedIssueTypeList } from '../../../../core/models/api-interfaces';

@Component({
  selector: 'app-issue-edit',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './issue-edit.component.html',
  styleUrl: './issue-edit.component.css'
})
export class IssueEditComponent {
  @Input() issueId!: string;
  @Output() close = new EventEmitter<void>();
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
      story_points: [0]
    });
  }

  ngOnInit(): void {
    this.loadIssueTypes();
    this.loadIssue();
  }

  async loadIssueTypes(): Promise<void> {
    try {
      const types = await this.issueService.getIssueTypes().toPromise();
      if (types) {
        this.issuesTypes.set(types);
        this.issueTypes.set(types.results || []);
      }
    } catch (error) {
      console.error('Error loading issue types:', error);
      this.error.set('Error al cargar los tipos de issue');
    }
  }

  async loadIssue(): Promise<void> {
    this.loading.set(true);
    try {
      const issueData = await this.issueService.getIssue(this.issueId).toPromise();
      if (issueData) {
        this.issue.set(issueData);
        // Llenar el formulario con los datos de la issue
        this.issueForm.patchValue({
          title: issueData.title,
          description: issueData.description || '',
          issue_type: issueData.issue_type?.id || '',
          priority: issueData.priority,
          estimated_hours: issueData.estimated_hours || 0,
          actual_hours: issueData.actual_hours || 0,
          story_points: issueData.story_points || 0
        });
      }
    } catch (error) {
      console.error('Error loading issue:', error);
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
          story_points: formData.story_points || 0
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
    this.close.emit();
  }
}
