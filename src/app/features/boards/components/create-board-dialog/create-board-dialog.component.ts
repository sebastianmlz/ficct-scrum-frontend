import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {BoardService} from '../../../../core/services/board.service';
import {NotificationService}
  from '../../../../core/services/notification.service';

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-board-dialog.component.html',
})
export class CreateBoardDialogComponent implements OnInit {
  private boardService = inject(BoardService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  error = signal<string | null>(null);
  projectId = signal<string>('');

  boardForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    board_type: ['kanban', Validators.required],
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.projectId.set(params['id']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    console.log('[CREATE BOARD] Starting board creation...');

    if (this.boardForm.invalid) {
      console.error('[CREATE BOARD] Form is invalid:', this.boardForm.errors);
      Object.keys(this.boardForm.controls).forEach((key) => {
        const control = this.boardForm.get(key);
        if (control?.invalid) {
          console.error(
              `[CREATE BOARD] Field '${key}' is invalid:`, control.errors);
        }
        control?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const formValue = this.boardForm.value;
      const boardData = {
        project: this.projectId(),
        name: formValue.name,
        description: formValue.description,
        board_type: formValue.board_type,
      };

      console.log('[CREATE BOARD] Sending request with data:', boardData);
      console.log('[CREATE BOARD] Project ID:', this.projectId());

      const response =
      await this.boardService.createBoard(boardData).toPromise();

      console.log('[CREATE BOARD] ✅ Response received:', response);
      console.log('[CREATE BOARD] Response has id:', !!response?.id);
      console.log('[CREATE BOARD] Response id value:', response?.id);

      if (response && response.id) {
        console.log(
            '[CREATE BOARD] Success! Navigating to board:', response.id);
        this.notificationService.success('Board created successfully');
        this.router.navigate(
            ['/projects', this.projectId(), 'boards', response.id]);
      } else {
        console.error('[CREATE BOARD] ❌ Response missing id:', response);
        throw new Error('Board created but no ID returned');
      }
    } catch (error: any) {
      console.error('[CREATE BOARD] ❌ Error occurred:', error);
      console.error('[CREATE BOARD] Error status:', error.status);
      console.error('[CREATE BOARD] Error statusText:', error.statusText);
      console.error('[CREATE BOARD] Error message:', error.message);
      console.error('[CREATE BOARD] Error body:', error.error);

      // Si es 201 Created pero entra al catch, es un problema de parsing
      if (error.status === 201) {
        console.error(
            '[CREATE BOARD] ⚠️ CRITICAL: Got 201 but entered error handler!');
        console.error(
            '[CREATE BOARD] This suggests interceptor or HttpClient issue');
      }

      const errorMessage = error.error?.message || error.error?.detail ||
      error.message || 'Failed to create board';
      this.error.set(errorMessage);
      this.notificationService.error(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects', this.projectId(), 'boards']);
  }

  getFieldError(fieldName: string): string {
    const field = this.boardForm.get(fieldName);
    if (field?.hasError('required') && field.touched) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } is required`;
    }
    if (field?.hasError('maxlength') && field.touched) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } is too long`;
    }
    return '';
  }
}
