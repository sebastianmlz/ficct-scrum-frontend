import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { BoardService } from '../../../../core/services/board.service';
import { Board } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './board-list.component.html',
})
export class BoardListComponent implements OnInit {
  private boardService = inject(BoardService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  boards = signal<Board[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  projectId = signal<string>('');

  searchForm: FormGroup = this.fb.group({
    search: [''],
    board_type: ['']
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
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
        board_type: this.searchForm.value.board_type || undefined
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
}
