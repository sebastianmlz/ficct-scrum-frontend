import {Component, inject, OnInit, signal} from '@angular/core';
import {ProjectConfigRequest} from '../../../core/models/interfaces';
import {ProjectsService} from '../../../core/services/projects.service';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule}
  from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-project-config-create',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-config-create.component.html',
  styleUrl: './project-config-create.component.css',
})
export class ProjectConfigCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private routerNav = inject(Router);
  private projectsService = inject(ProjectsService);

  loading = signal(false);
  error = signal<string | null>(null);
  projectId = '';

  configForm: FormGroup = this.fb.group({
    sprint_duration: [1, [Validators.required, Validators.min(1)]],
    auto_close_sprints: [true],
    estimation_type: ['story_points', [Validators.required]],
    story_point_scale_additionalProp1: [''],
    story_point_scale_additionalProp2: [''],
    story_point_scale_additionalProp3: [''],
    enable_time_tracking: [true],
    require_time_logging: [true],
    enable_sub_tasks: [true],
    email_notifications: [true],
    slack_notifications: [false],
    slack_webhook_url: [''],
    restrict_issue_visibility: [false],
    require_approval_for_changes: [false],
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.projectId = params['id'];
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    // Transformar los campos del form a la estructura esperada por la API
    const config: ProjectConfigRequest = {
      project: this.projectId,
      sprint_duration: this.configForm.value.sprint_duration,
      auto_close_sprints: this.configForm.value.auto_close_sprints,
      estimation_type: this.configForm.value.estimation_type,
      story_point_scale: {
        additionalProp1:
        this.configForm.value.story_point_scale_additionalProp1,
        additionalProp2:
        this.configForm.value.story_point_scale_additionalProp2,
        additionalProp3:
        this.configForm.value.story_point_scale_additionalProp3,
      },
      enable_time_tracking: this.configForm.value.enable_time_tracking,
      require_time_logging: this.configForm.value.require_time_logging,
      enable_sub_tasks: this.configForm.value.enable_sub_tasks,
      email_notifications: this.configForm.value.email_notifications,
      slack_notifications: this.configForm.value.slack_notifications,
      slack_webhook_url: this.configForm.value.slack_webhook_url,
      restrict_issue_visibility:
      this.configForm.value.restrict_issue_visibility,
      require_approval_for_changes:
      this.configForm.value.require_approval_for_changes,
    };

    this.projectsService.createProjectConfig(config).subscribe({
      next: () => {
        this.loading.set(false);
        // Redirigir o mostrar confirmación
        this.routerNav.navigate(['/projects', this.projectId]);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set(error.error?.message ||
          'Error creating project configuration');
      },
    });
  }
}
