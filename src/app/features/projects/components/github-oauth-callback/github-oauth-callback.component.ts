import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {GitHubIntegrationStateService}
  from '../../../../core/services/github-integration-state.service';
import {RepositorySelectionModalComponent}
  from '../repository-selection-modal/repository-selection-modal.component';

@Component({
  selector: 'app-github-oauth-callback',
  standalone: true,
  imports: [CommonModule, RepositorySelectionModalComponent],
  templateUrl: './github-oauth-callback.component.html',
  styles: [],
})
export class GitHubOAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private integrationState = inject(GitHubIntegrationStateService);

  processing = true;
  success = false;
  error = false;
  errorMessage = '';
  showRepositorySelection = signal(false);
  tempToken = signal('');
  projectId = signal('');

  ngOnInit(): void {
    // Get query parameters from URL
    this.route.queryParams.subscribe((params) => {
      const status = params['status'];
      const message = params['message'];
      const integrationId = params['integration_id'];
      const errorMsg = params['error'];
      const tempToken = params['temp_token'];
      const selectRepo = params['github'];

      // Try multiple sources for projectId
      const projectIdFromStorage =
      localStorage.getItem('github_oauth_project_id');
      const projectIdFromRoute = this.route.snapshot.params['projectId'];
      const projectIdFromQuery = params['project_id'] || params['projectId'];
      const projectId = projectIdFromStorage || projectIdFromRoute ||
      projectIdFromQuery;

      // NEW FLOW: Check for repository selection requirement
      if (selectRepo === 'select_repo') {
        if (!projectId) {
          this.handleError('Missing project ID. Please try connecting again ' +
            'from project settings.');
          return;
        }

        this.processing = false;
        this.projectId.set(projectId);
        this.tempToken.set(tempToken || '');
        this.showRepositorySelection.set(true);
        return; // Don't clean localStorage yet
      }

      // Legacy flow: Direct success/error handling
      if (status === 'success' && integrationId) {
        this.handleSuccess(message ||
          'GitHub repository connected successfully', projectId);
      } else if (status === 'error' || errorMsg) {
        this.handleError(errorMsg || message ||
          'Failed to connect GitHub repository');
      } else {
        this.handleError('Invalid callback parameters. Please try connecting' +
          ' again from project settings.');
      }

      // Clean up localStorage
      localStorage.removeItem('github_oauth_project_id');
    });
  }

  handleSuccess(message: string, projectId: string | null): void {
    this.processing = false;
    this.success = true;
    this.notificationService.success(message);

    // Redirect to project GitHub integration page after 2 seconds
    setTimeout(() => {
      if (projectId) {
        this.router.navigate(['/projects', projectId, 'github']);
      } else {
        this.router.navigate(['/projects']);
      }
    }, 2000);
  }

  handleError(message: string): void {
    this.processing = false;
    this.error = true;
    this.errorMessage = message;
    this.notificationService.error(message);
  }

  goToProject(): void {
    const projectId = localStorage.getItem('github_oauth_project_id');
    localStorage.removeItem('github_oauth_project_id');

    if (projectId) {
      this.router.navigate(['/projects', projectId, 'github']);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  onRepositorySelected(): void {
    this.showRepositorySelection.set(false);
    const projectId = this.projectId();

    // Refresh state service cache with new integration
    if (projectId) {
      this.integrationState.refreshIntegrationStatus(projectId).subscribe();
    }

    // Clean up and redirect
    localStorage.removeItem('github_oauth_project_id');

    if (projectId) {
      this.router.navigate(['/projects', projectId, 'config'], {
        fragment: 'integrations',
      });
    } else {
      this.router.navigate(['/projects']);
    }
  }

  onRepositorySelectionCancelled(): void {
    this.showRepositorySelection.set(false);
    const projectId = this.projectId();

    localStorage.removeItem('github_oauth_project_id');

    if (projectId) {
      this.router.navigate(['/projects', projectId, 'config'], {
        fragment: 'integrations',
      });
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
