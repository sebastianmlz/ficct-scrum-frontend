import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sprint } from '../../../../core/models/interfaces';
import { SprintsService } from '../../../../core/services/sprints.service';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-sprint-detail',
  imports: [CommonModule],
  templateUrl: './sprint-detail.component.html',
  styleUrls: ['./sprint-detail.component.css']
})

export class SprintDetailComponent {
  @Input() sprintId!: string;
  @Output() close = new EventEmitter<void>();

  loading = signal(true);
  error = signal<string | null>(null);
  sprintInfo = signal<Sprint | null>(null);
  sprintDetailService = inject(SprintsService);

  ngOnInit(): void {
    console.log("SprintDetailComponent initialized");
    this.loadSprintDetails();
  }

  async loadSprintDetails(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (!this.sprintId) {
        this.error.set("No sprint selected");
        return;
      }
      const sprintData = await firstValueFrom(this.sprintDetailService.getSprint(this.sprintId));
      if (sprintData) {
        this.sprintInfo.set(sprintData);
      }
    } catch (error) {
      this.error.set("Failed to load sprint details");
    } finally {
      this.loading.set(false);
    }
  }

  onClose():void {
    this.close.emit();
  }

}
