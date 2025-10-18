import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-sprint-create',
  imports: [],
  templateUrl: './sprint-create.component.html',
  styleUrl: './sprint-create.component.css'
})
export class SprintCreateComponent {
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() sprintCreated = new EventEmitter<any>();

  // Aquí iría la lógica del formulario y envío
  onClose() {
    this.close.emit();
  }

  onSprintCreated(sprint: any) {
    this.sprintCreated.emit(sprint);
    this.onClose();
  }
}
