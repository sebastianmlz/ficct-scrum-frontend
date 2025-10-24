import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IssueService } from '../../../../core/services/issue.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Issue, IssueType } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-create-issue-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-issue-dialog.component.html',
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-content {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #374151;
    }

    .required {
      color: #ef4444;
    }

    input, select, textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea {
      min-height: 100px;
      resize: vertical;
    }

    .error-text {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
    }

    .button-group {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class CreateIssueDialogComponent implements OnInit {
  @Input() projectId!: string;
  @Input() boardId!: string;
  @Input() defaultStatusId?: string;
  @Output() issueCreated = new EventEmitter<Issue>();
  @Output() canceled = new EventEmitter<void>();

  private issueService = inject(IssueService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  issueTypes = signal<IssueType[]>([]);

  issueForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(500)]],
    description: [''],
    issue_type: ['', Validators.required],
    priority: ['P3'], // Default: Medium
  });

  priorities = [
    { value: 'P1', label: 'Critical' },
    { value: 'P2', label: 'High' },
    { value: 'P3', label: 'Medium' },
    { value: 'P4', label: 'Low' }
  ];

  ngOnInit(): void {
    console.log('[CREATE ISSUE] Dialog initialized');
    console.log('[CREATE ISSUE] Project ID:', this.projectId);
    console.log('[CREATE ISSUE] Board ID:', this.boardId);
    console.log('[CREATE ISSUE] Default Status ID:', this.defaultStatusId);
    
    this.loadIssueTypes();
  }

  loadIssueTypes(): void {
    console.log('[CREATE ISSUE] Loading issue types for project:', this.projectId);
    
    // ✅ CRITICAL FIX: Filter issue types by project
    this.issueService.getIssueTypes(this.projectId).subscribe({
      next: (response) => {
        console.log('[CREATE ISSUE] ✅ Issue types loaded (filtered by project):', response.results);
        console.log('[CREATE ISSUE] Number of issue types:', response.results.length);
        
        this.issueTypes.set(response.results);
        
        // Pre-select first issue type if available
        if (response.results.length > 0 && !this.issueForm.get('issue_type')?.value) {
          this.issueForm.patchValue({ issue_type: response.results[0].id });
          console.log('[CREATE ISSUE] Pre-selected issue type:', response.results[0].name);
        } else if (response.results.length === 0) {
          console.error('[CREATE ISSUE] ❌ No issue types found for project:', this.projectId);
          this.notificationService.error('No issue types available for this project');
        }
      },
      error: (error) => {
        console.error('[CREATE ISSUE] ❌ Failed to load issue types:', error);
        console.error('[CREATE ISSUE] Error status:', error.status);
        console.error('[CREATE ISSUE] Error body:', error.error);
        this.notificationService.error('Failed to load issue types');
      }
    });
  }

  async onSubmit(): Promise<void> {
    console.log('[CREATE ISSUE] Form submitted');
    
    if (this.issueForm.invalid) {
      console.error('[CREATE ISSUE] Form is invalid');
      Object.keys(this.issueForm.controls).forEach(key => {
        const control = this.issueForm.get(key);
        if (control?.invalid) {
          console.error(`[CREATE ISSUE] Field '${key}' is invalid:`, control.errors);
        }
        control?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);

    try {
      const formValue = this.issueForm.value;
      const issueData = {
        project: this.projectId,
        title: formValue.title,
        description: formValue.description || '',
        issue_type: formValue.issue_type,
        priority: formValue.priority
      };

      console.log('[CREATE ISSUE] Sending request:', issueData);

      const issue = await this.issueService.createIssue(issueData).toPromise();
      
      console.log('[CREATE ISSUE] ✅ Issue created successfully:', issue);
      
      if (issue) {
        this.notificationService.success('Issue created successfully');
        this.issueCreated.emit(issue);
      }
    } catch (error: any) {
      console.error('[CREATE ISSUE] ❌ Error creating issue:', error);
      console.error('[CREATE ISSUE] Error status:', error.status);
      console.error('[CREATE ISSUE] Error body:', error.error);
      
      const errorMessage = error.error?.detail || error.error?.message || error.message || 'Failed to create issue';
      this.notificationService.error(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    console.log('[CREATE ISSUE] Dialog canceled');
    this.canceled.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.issueForm.get(fieldName);
    if (field?.hasError('required') && field.touched) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field?.hasError('maxlength') && field.touched) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      issue_type: 'Issue Type',
      priority: 'Priority'
    };
    return labels[fieldName] || fieldName;
  }
}
