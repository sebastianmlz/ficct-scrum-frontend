import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SprintsService } from '../../../../core/services/sprints.service';
import { Sprint, SprintRequest } from '../../../../core/models/interfaces';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-sprint-edit',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sprint-edit.component.html',
  styleUrl: './sprint-edit.component.css'
})
export class SprintEditComponent {
  @Input() sprintId!: string;
  @Output() close = new EventEmitter<void>();

  sprintEditService = inject(SprintsService)
  fb = inject(FormBuilder)
  loading = false;
  error: string | null = null;
  sprint: Sprint | null = null;
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    goal: [''],
    start_date: ['', Validators.required],
    end_date: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.sprintId) {
      this.loadSprint();
    }
  }

  async loadSprint(): Promise<void> {
    this.loading = true;
    try {
      const sprintData = await this.sprintEditService.getSprint(this.sprintId).toPromise();
      if (sprintData) {
        this.sprint = sprintData;
        this.form.patchValue({
          name: sprintData.name ?? '',
          goal: sprintData.goal ?? '',
          start_date: sprintData.start_date ? sprintData.start_date.toString().slice(0,10) : '',
          end_date: sprintData.end_date ? sprintData.end_date.toString().slice(0,10) : ''
        });
      } else {
        this.sprint = null;
        this.error = 'No se encontró el sprint.';
      }
    } catch (error) {
      this.error = 'error al cargar los datos';
    }
    this.loading = false;
  }

  async editSprintData(): Promise<void> {
    if (!this.form.valid) return;
    this.loading = true;
    const sprintReq: Partial<SprintRequest> = {
      name: this.form.value.name,
      goal: this.form.value.goal,
      start_date: this.form.value.start_date,
      end_date: this.form.value.end_date,
    };
    try {
      await this.sprintEditService.editSprint(this.sprintId, sprintReq as SprintRequest).toPromise();
      this.close.emit();
    } catch (error) {
      this.error = 'Error al editar sprint';
    }
    this.loading = false;
  }

  handleClose(): void {
    this.close.emit();
  }
}
