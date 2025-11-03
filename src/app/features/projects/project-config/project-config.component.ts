import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectConfigRequest } from '../../../core/models/interfaces';
import { GitHubIntegrationComponent } from '../components/github-integration/github-integration.component';

@Component({
  selector: 'app-project-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GitHubIntegrationComponent],
  templateUrl: './project-config.component.html',
})

export class ProjectConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  projectId: string = '';
  project = signal<Project | null>(null);
  loading = signal(true);
  saving = signal(false);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  activeTab = signal<string>('general');

  configForm: FormGroup = this.fb.group({
    visibility: ['internal'],
    allow_comments: [true],
    allow_attachments: [true],
    enable_time_tracking: [true],
    auto_archive_completed: [false]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadProject();
      }
    });

    // Check for fragment to auto-activate integrations tab
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'integrations') {
        this.activeTab.set('integrations');
      }
    });
  }

  async loadProject(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    try {
      const project = await this.projectService.getProject(this.projectId).toPromise();
      if (project) {
        this.project.set(project);
        // In a real app, you would load the project configuration from the API
        // For now, we'll use default values
      }
    } catch (error: any) {
      this.loadError.set(error.error?.message || 'Failed to load project');
    } finally {
      this.loading.set(false);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    this.saveError.set(null);
    this.successMessage.set(null);
  }

  getTabClass(tab: string): string {
    const isActive = this.activeTab() === tab;
    return isActive
      ? 'bg-primary text-white hover:bg-primary/90'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  }

  async onSaveConfig(): Promise<void> {
    this.saving.set(true);
    this.saveError.set(null);
    this.successMessage.set(null);

    try {
      // In a real app, you would call the project configuration API endpoint
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.successMessage.set('Project settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to save project settings');
    } finally {
      this.saving.set(false);
    }
  }

  async archiveProject(): Promise<void> {
    if (!confirm('Are you sure you want to archive this project? It will be hidden from the main project list.')) {
      return;
    }

    try {
      // In a real app, you would call the archive API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.router.navigate(['/projects']);
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to archive project');
    }
  }

  confirmDeleteProject(): void {
    const projectName = this.project()?.name || 'this project';
    const confirmation = prompt(
      `This action cannot be undone. Type "${projectName}" to confirm deletion:`
    );

    if (confirmation === projectName) {
      this.deleteProject();
    } else if (confirmation !== null) {
      alert('Project name does not match. Deletion cancelled.');
    }
  }

  async deleteProject(): Promise<void> {
    try {
      await this.projectService.deleteProject(this.projectId).toPromise();
      this.router.navigate(['/projects']);
    } catch (error: any) {
      this.saveError.set(error.error?.message || 'Failed to delete project');
    }
  }
}
