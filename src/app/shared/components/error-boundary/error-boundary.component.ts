import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: 'error-boundary.component.html',
  styleUrl: 'error-boundary.component.css',
})
export class ErrorBoundaryComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'An unexpected error occurred. Please try again.';
  @Input() details?: string;
  @Input() showRetry = true;
  @Input() showReload = false;
  @Input() dismissible = false;

  @Output() retry = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  reloadPage(): void {
    window.location.reload();
  }
}
