import {Component, Input, OnInit, signal, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {IssueService} from '../../../../core/services/issue.service';
import {IssueComment, PaginatedIssueCommentList, UserBasic}
  from '../../../../core/models/interfaces';
import {AuthService} from '../../../../core/services/auth.service';

@Component({
  selector: 'app-issue-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './issue-comments.component.html',
  styleUrl: './issue-comments.component.css',
})
export class IssueCommentsComponent implements OnInit {
  @Input() issueId!: string;

  private issueService = inject(IssueService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Signals
  comments = signal<IssueComment[]>([]);
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalComments = signal(0);
  editingCommentId = signal<string | null>(null);
  currentUser = signal<UserBasic | null>(null);

  // Forms
  commentForm: FormGroup;
  editForm: FormGroup;

  constructor() {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
    });

    this.editForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit() {
    if (!this.issueId) {
      this.error.set('Issue ID is required');
      return;
    }

    this.loadCurrentUser();
    this.loadComments();
  }

  private loadCurrentUser() {
    // Asumiendo que tienes un método para obtener el usuario actual
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
  }

  loadComments(page = 1) {
    this.loading.set(true);
    this.error.set(null);

    this.issueService.getIssueComments(this.issueId, {
      page,
      ordering: '-created_at',
    }).subscribe({
      next: (response: PaginatedIssueCommentList) => {
        this.comments.set(response.results);
        this.totalComments.set(response.count);
        this.totalPages.set(Math.ceil(response.count / 10));
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los comentarios');
        this.loading.set(false);
        console.error('Error loading comments:', err);
      },
    });
  }

  onSubmitComment() {
    if (this.commentForm.valid && !this.submitting()) {
      this.submitting.set(true);
      const content = this.commentForm.value.content.trim();

      this.issueService.createIssueComment(this.issueId, content).subscribe({
        next: (newComment) => {
          // Agregar el nuevo comentario al inicio de la lista
          this.comments.update((comments) => [newComment, ...comments]);
          this.totalComments.update((count) => count + 1);
          this.commentForm.reset();
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear el comentario');
          this.submitting.set(false);
          console.error('Error creating comment:', err);
        },
      });
    }
  }

  startEdit(comment: IssueComment) {
    this.editingCommentId.set(comment.id);
    this.editForm.patchValue({content: comment.content});
  }

  cancelEdit() {
    this.editingCommentId.set(null);
    this.editForm.reset();
  }

  onUpdateComment(commentId: string) {
    if (this.editForm.valid) {
      const content = this.editForm.value.content.trim();

      this.issueService.updateIssueComment(this.issueId, commentId, content)
          .subscribe({
            next: (updatedComment) => {
              this.comments.update((comments) =>
                comments.map((c) => c.id === commentId ? updatedComment : c),
              );
              this.editingCommentId.set(null);
              this.editForm.reset();
            },
            error: (err) => {
              this.error.set('Error al actualizar el comentario');
              console.error('Error updating comment:', err);
            },
          });
    }
  }

  onDeleteComment(commentId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      this.issueService.deleteIssueComment(this.issueId, commentId).subscribe({
        next: () => {
          this.comments.update((comments) =>
            comments.filter((c) => c.id !== commentId),
          );
          this.totalComments.update((count) => count - 1);
        },
        error: (err) => {
          this.error.set('Error al eliminar el comentario');
          console.error('Error deleting comment:', err);
        },
      });
    }
  }

  canEditComment(comment: IssueComment): boolean {
    return this.currentUser()?.id === comment.author.id;
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadComments(page);
    }
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
        .toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) {
      return `hace ${Math.floor(diffInSeconds / 60)} min`;
    }
    if (diffInSeconds < 86400) {
      return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    }
    if (diffInSeconds < 604800) {
      return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    }

    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
