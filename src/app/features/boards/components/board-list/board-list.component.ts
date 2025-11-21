import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, ActivatedRoute} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {BoardService} from '../../../../core/services/board.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {Board} from '../../../../core/models/interfaces';
import {BoardEditComponent} from '../board-edit/board-edit.component';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, BoardEditComponent],
  templateUrl: './board-list.component.html',
})
export class BoardListComponent implements OnInit {
  private boardService = inject(BoardService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  boards = signal<Board[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  projectId = signal<string>('');

  // Modal edición board
  showEditBoardModal = signal(false);
  selectedBoard = signal<Board | null>(null);
  editBoard(board: Board, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedBoard.set(board);
    this.showEditBoardModal.set(true);
  }

  closeEditBoardModal(): void {
    this.showEditBoardModal.set(false);
    this.selectedBoard.set(null);
  }

  searchForm: FormGroup = this.fb.group({
    search: [''],
    board_type: [''],
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.projectId.set(params['id']);
        this.loadBoards();
      }
    });
  }

  async loadBoards(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const filters = {
        project: this.projectId(),
        search: this.searchForm.value.search || undefined,
        board_type: this.searchForm.value.board_type || undefined,
      };

      const response = await this.boardService.getBoards(filters).toPromise();

      if (response) {
        this.boards.set(response);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load boards');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    this.loadBoards();
  }

  getBoardTypeBadgeClass(type: string): string {
    switch (type) {
      case 'kanban':
        return 'bg-blue-100 text-blue-800';
      case 'scrum':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  async deleteBoard(board: Board, event: Event): Promise<void> {
    // Prevenir que el click del botón active la navegación al board
    event.stopPropagation();
    event.preventDefault();

    // Confirmar eliminación
    const confirmed = confirm(`Are you sure you want to delete "${
      board.name}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      console.log('[BOARD-LIST] Deleting board:', board.id);

      await this.boardService.deleteBoard(board.id).toPromise();

      console.log('[BOARD-LIST] ✅ Board deleted successfully');
      this.notificationService.success(`Board "${
        board.name}" deleted successfully`);

      // Recargar la lista de boards
      await this.loadBoards();
    } catch (error: any) {
      console.error('[BOARD-LIST] ❌ Error deleting board:', error);

      const errorMessage = error.error?.detail || error.error?.message ||
      'Failed to delete board';
      this.notificationService.error(errorMessage);
    }
  }
}
