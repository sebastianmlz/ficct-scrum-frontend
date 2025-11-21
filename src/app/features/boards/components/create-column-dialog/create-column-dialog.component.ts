import {Component, inject, OnInit, signal, Input, Output, EventEmitter}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {BoardService} from '../../../../core/services/board.service';
import {ProjectService} from '../../../../core/services/project.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {WorkflowStatus, BoardColumn} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-create-column-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-column-dialog.component.html',
})
export class CreateColumnDialogComponent implements OnInit {
  private boardService = inject(BoardService);
  private projectService = inject(ProjectService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  @Input() boardId!: string;
  @Input() projectId!: string;
  @Output() columnCreated = new EventEmitter<BoardColumn>();
  @Output() canceled = new EventEmitter<void>();

  loading = signal(false);
  error = signal<string | null>(null);
  workflowStatuses = signal<WorkflowStatus[]>([]);
  loadingStatuses = signal(true);

  columnForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    workflow_status_id: ['', Validators.required],
    min_wip: [null],
    max_wip: [null],
  });

  async ngOnInit(): Promise<void> {
    await this.loadWorkflowStatuses();
  }

  async loadWorkflowStatuses(): Promise<void> {
    try {
      this.loadingStatuses.set(true);
      // Default workflow statuses (can be extended with project-specific status
      const defaultStatuses: WorkflowStatus[] = [
        {id: 'to-do', name: 'To Do', color: '#6B7280'} as WorkflowStatus,
        {id: 'in-progress', name: 'In Progress',
          color: '#3B82F6'} as WorkflowStatus,
        {id: 'in-review', name: 'In Review',
          color: '#8B5CF6'} as WorkflowStatus,
        {id: 'done', name: 'Done', color: '#10B981'} as WorkflowStatus,
      ];
      this.workflowStatuses.set(defaultStatuses);
    } catch (error: any) {
      console.log(error);
      this.notificationService.error('Failed to load workflow statuses');
    } finally {
      this.loadingStatuses.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.columnForm.invalid) {
      Object.keys(this.columnForm.controls).forEach((key) => {
        this.columnForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const formValue = this.columnForm.value;
      const columnData = {
        name: formValue.name,
        workflow_status_id: formValue.workflow_status_id,
        min_wip: formValue.min_wip || null,
        max_wip: formValue.max_wip || null,
      };

      const response =
        await this.boardService.createColumn(this.boardId, columnData)
            .toPromise();

      if (response) {
        this.notificationService.success('Column created successfully');
        this.columnCreated.emit(response);
      }
    } catch (error: any) {
      console.error('Error creating column:', error);
      const errorMessage = error.error?.message || 'Failed to create column';
      this.error.set(errorMessage);
      this.notificationService.error(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    this.canceled.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.columnForm.get(fieldName);
    if (field?.hasError('required') && field.touched) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
          .replace('_', ' ')} is required`;
    }
    if (field?.hasError('maxlength') && field.touched) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } is too long`;
    }
    return '';
  }
}
