import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CdkDragDrop, CdkDropList, CdkDrag} from '@angular/cdk/drag-drop';
import {BoardColumn, Issue} from '../../../../core/models/interfaces';
import {IssueCardComponent} from '../issue-card/issue-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, IssueCardComponent],
  templateUrl: './board-column.component.html',
})
export class BoardColumnComponent {
  @Input() column!: BoardColumn;
  @Input() issues: Issue[] = [];
  @Input() loading = false;
  @Input() connectedDropLists: string[] = [];
  @Input() projectId!: string;

  @Output() issueDropped = new EventEmitter<{ issueId: string;
    targetColumnId: string; targetStatusId: string }>();
  @Output() createIssueClicked = new EventEmitter<string>();
  @Output() issueClicked = new EventEmitter<Issue>();
  @Output() assigneeChanged = new EventEmitter<{ issueId: string;
    assigneeId: string | null }>();

  drop(event: CdkDragDrop<Issue[]>): void {
    console.log('[COLUMN DROP] === DROP EVENT EN COLUMNA ===');
    console.log('[COLUMN DROP] Column:', this.column.workflow_status.name);
    console.log('[COLUMN DROP] Previous container:',
        event.previousContainer.id);
    console.log('[COLUMN DROP] Current container:', event.container.id);
    console.log('[COLUMN DROP] Same container?:',
        event.previousContainer === event.container);
    console.log('[COLUMN DROP] Previous index:', event.previousIndex);
    console.log('[COLUMN DROP] Current index:', event.currentIndex);

    if (event.previousContainer === event.container) {
      // Reordenamiento dentro de la misma columna
      console.log('[COLUMN DROP] Reordenando dentro de misma columna');
      // TODO: Implementar reordenamiento si backend lo soporta
      console.log('[COLUMN DROP] Reordenamiento no implementado aún');
    } else {
      // Movimiento entre columnas
      const issue = event.previousContainer.data[event.previousIndex];
      console.log('[COLUMN DROP] Moviendo issue entre columnas:',
          issue.id, issue.title);
      console.log('[COLUMN DROP] From:', event.previousContainer.id, 'To:',
          event.container.id);
      console.log('[COLUMN DROP] Target column workflow_status:',
          this.column.workflow_status);

      // ✅ SOLO EMITIR EVENTO - NO modificar arrays directamente
      // El board-detail se encargará de actualizar el signal inmutablemente
      const dropEvent = {
        issueId: issue.id,
        targetColumnId: this.column.id,
        targetStatusId: this.column.workflow_status.id,
        previousStatusId: event.previousContainer.id,
      };
      console.log('[COLUMN DROP] Emitiendo issueDropped event:', dropEvent);
      console.log(
          '[COLUMN DROP] Board-detail actualizará el signal inmutablemente');
      this.issueDropped.emit(dropEvent);

      // ❌ NO USAR transferArrayItem - causa que signal no detecte cambios
      // La actualización se hace en board-detail con signal.update()
    }
    console.log('[COLUMN DROP] === FIN DROP EVENT ===');
  }

  onCreateIssue(): void {
    this.createIssueClicked.emit(this.column.id);
  }

  onIssueClick(issue: Issue): void {
    this.issueClicked.emit(issue);
  }

  onAssigneeChanged(event: { issueId: string;
    assigneeId: string | null }): void {
    this.assigneeChanged.emit(event);
  }

  getWipStatus(): 'normal' | 'warning' | 'exceeded' {
    const count = this.issues.length;

    if (this.column.max_wip) {
      if (count > this.column.max_wip) return 'exceeded';
      if (count >= this.column.max_wip * 0.8) return 'warning';
    }

    return 'normal';
  }

  getWipClass(): string {
    const status = this.getWipStatus();
    switch (status) {
      case 'exceeded':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  trackByIssueId(index: number, issue: Issue): string {
    return issue.id;
  }
}
