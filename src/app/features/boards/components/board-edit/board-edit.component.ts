import {Component, Input, Output, EventEmitter, inject, OnChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {BoardService} from '../../../../core/services/board.service';
import {Board} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-board-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './board-edit.component.html',
  styleUrl: './board-edit.component.css',
})
export class BoardEditComponent implements OnChanges {
  @Input() board: Board | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() boardUpdated = new EventEmitter<Board>();

  private fb = inject(FormBuilder);
  private boardService = inject(BoardService);

  editForm: FormGroup = this.fb.group({
    name: [''],
    description: [''],
    board_type: ['kanban'],
  });

  ngOnChanges() {
    if (this.board) {
      this.editForm.patchValue({
        name: this.board.name,
        description: this.board.description,
        board_type: this.board.board_type,
      });
    }
  }

  onCancel() {
    this.closed.emit();
  }

  async onSubmit() {
    if (!this.board) return;
    const updated = {
      name: this.editForm.value.name,
      description: this.editForm.value.description,
      board_type: this.editForm.value.board_type,
    };
    try {
      const result = await this.boardService.updateBoard(this.board.id, updated).toPromise();
      this.boardUpdated.emit(result);
      this.closed.emit();
    } catch (error: any) {
      // Manejo de error simple
      alert(error?.error?.message || 'Error updating board');
    }
  }
}
