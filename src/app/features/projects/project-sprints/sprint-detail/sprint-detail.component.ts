import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sprint, SprintBurdown } from '../../../../core/models/interfaces';
import { SprintsService } from '../../../../core/services/sprints.service';
import { firstValueFrom } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { AiSprintSummaryComponent } from '../ai-sprint-summary/ai-sprint-summary.component';

@Component({
  selector: 'app-sprint-detail',
  standalone: true,
  imports: [CommonModule, ChartModule, AiSprintSummaryComponent],
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
  sprintBurdown = signal<SprintBurdown | null>(null);

  burndownChartData: any = null;
  burndownChartOptions: any = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#374151', font: { size: 14 } }
      },
      tooltip: { enabled: true }
    },
    scales: {
      x: { title: { display: true, text: 'Date', color: '#374151' }, ticks: { color: '#6b7280' } },
      y: { title: { display: true, text: 'Points', color: '#374151' }, ticks: { color: '#6b7280' }, beginAtZero: true }
    }
  };

  ngOnInit(): void {
    console.log("SprintDetailComponent initialized");
    this.loadSprintDetails();
    this.loadSprintBurndown();
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

  async loadSprintBurndown(): Promise<void> {
    this.loading.set(true);
    try {
      if (!this.sprintId) {
        this.error.set("No sprint selected");
        return;
      }
      const burndownData: SprintBurdown = await firstValueFrom(this.sprintDetailService.getSprintBurdown(this.sprintId));
      if (burndownData) {
        this.sprintBurdown.set(burndownData);

        // Ideal line
        const labels = burndownData.ideal_line.map(d => d.date);
        const idealPoints = burndownData.ideal_line.map(d => d.remaining_points);

        // Actual line (si existe)
        let actualPoints: number[] = [];
        if (burndownData.actual_line) {
          actualPoints = burndownData.actual_line.map(d => d.remaining_points);
        }

        this.burndownChartData = {
          labels,
          datasets: [
            {
              label: 'Ideal',
              data: idealPoints,
              borderColor: '#6366f1',
              backgroundColor: '#6366f1',
              fill: false,
              tension: 0.2
            },
            ...(actualPoints.length
              ? [{
                  label: 'Actual',
                  data: actualPoints,
                  borderColor: '#f59e42',
                  backgroundColor: '#f59e42',
                  fill: false,
                  tension: 0.2
                }]
              : [])
          ]
        };
      }
    } catch (error) {
      this.error.set("Failed to load sprint burndown data");
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
