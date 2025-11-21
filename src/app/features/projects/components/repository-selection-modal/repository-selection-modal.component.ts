import {Component, inject, OnInit, signal, Input, Output, EventEmitter}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {GitHubIntegrationService}
  from '../../../../core/services/github-integration.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {GitHubOAuthRepository} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-repository-selection-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'repository-selection-modal.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 0.5rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .repository-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s;
      text-align: left;
      background: white;
    }

    .repository-card:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .repository-card.selected {
      border-color: #3b82f6;
      background: #dbeafe;
    }

    .badge-private {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #78350f;
      background: #fef3c7;
      border-radius: 9999px;
    }

    .badge-public {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #065f46;
      background: #d1fae5;
      border-radius: 9999px;
    }

    .skeleton-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .skeleton-icon {
      width: 2.5rem;
      height: 2.5rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-content {
      flex: 1;
    }

    .skeleton-title {
      height: 1rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      width: 60%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .skeleton-description {
      height: 0.75rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      width: 80%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .btn-secondary {
      padding: 0.5rem 1rem;
      font-weight: 500;
      color: #374151;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f9fafb;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      font-weight: 500;
      color: white;
      background: #3b82f6;
      border: none;
      border-radius: 0.375rem;
      transition: all 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .modal-content {
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }
  `],
})
export class RepositorySelectionModalComponent implements OnInit {
  @Input() projectId!: string;
  @Input() tempToken!: string;
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private githubService = inject(GitHubIntegrationService);
  private notificationService = inject(NotificationService);

  repositories = signal<GitHubOAuthRepository[]>([]);
  selectedRepository = signal<GitHubOAuthRepository | null>(null);
  loading = signal(true);
  completing = signal(false);
  error = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadRepositories();
  }

  loadRepositories(): void {
    this.loading.set(true);
    this.error.set(false);

    this.githubService.getAvailableRepositories(this.projectId,
        this.tempToken).subscribe({
      next: (response) => {
        this.repositories.set(response.repositories);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading repositories:', err);
        this.error.set(true);
        this.errorMessage.set(err.error?.error ||
          'Failed to load repositories');
        this.loading.set(false);

        if (err.status === 400 && err.error?.error?.includes('expired')) {
          this.errorMessage.set(
              'Authorization expired. Please reconnect GitHub.');
        }
      },
    });
  }

  selectRepository(repo: GitHubOAuthRepository): void {
    this.selectedRepository.set(repo);
  }

  onConfirm(): void {
    const selected = this.selectedRepository();
    if (!selected) return;

    this.completing.set(true);

    this.githubService.completeIntegration({
      temp_token: this.tempToken,
      repository_url: selected.html_url,
      repository_name: selected.full_name,
      project: this.projectId,
    }).subscribe({
      next: () => {
        this.notificationService.success(
            'GitHub repository connected successfully!');
        this.completing.set(false);
        this.completed.emit();
      },
      error: (err) => {
        console.error('Error completing integration:', err);
        this.notificationService.error(err.error?.error ||
          'Failed to complete integration');
        this.completing.set(false);
      },
    });
  }

  onCancel(): void {
    if (!this.completing()) {
      this.cancelled.emit();
    }
  }
}
