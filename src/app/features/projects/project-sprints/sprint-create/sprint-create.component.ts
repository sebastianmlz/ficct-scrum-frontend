import {Component, Input, Output, EventEmitter, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {SprintRequest} from '../../../../core/models/interfaces';
import {SprintsService} from '../../../../core/services/sprints.service';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-sprint-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sprint-create.component.html',
  styleUrl: './sprint-create.component.css',
})
export class SprintCreateComponent {
  @Input() projectId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() sprintCreated = new EventEmitter<any>();

  loading = false;
  error: string | null = null;

  router = inject(Router);
  sprintRequestService = inject(SprintsService);
  fb = inject(FormBuilder);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      goal: [''],
    });
  }

  onClose() {
    this.close.emit();
  }


  async onSubmit() {
    if (this.form.invalid || !this.projectId) return;
    this.loading = true;
    this.error = null;
    const sprint: SprintRequest = {
      project: this.projectId,
      name: this.form.get('name')?.value,
      start_date: this.form.get('start_date')?.value,
      end_date: this.form.get('end_date')?.value,
      goal: this.form.get('goal')?.value,
    };
    console.log('Creating sprint:', sprint);
    try {
      const createdSprint = await this.sprintRequestService.createSprints(sprint).toPromise();
      this.sprintCreated.emit(createdSprint);
      this.onClose();
    } catch (error: any) {
      this.error = error?.message || 'Error creating sprint';
    } finally {
      this.loading = false;
    }
  }
}
