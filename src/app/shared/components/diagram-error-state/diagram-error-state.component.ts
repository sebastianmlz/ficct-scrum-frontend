import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {DiagramErrorState} from '../../utils/diagram-error.utils';

@Component({
  selector: 'app-diagram-error-state',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'diagram-error-state.component.html',
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class DiagramErrorStateComponent {
  @Input() errorState!: DiagramErrorState;
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
