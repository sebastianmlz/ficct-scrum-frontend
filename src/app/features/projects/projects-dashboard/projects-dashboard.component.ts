import { Component, inject, OnInit, signal, AfterViewInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { SprintsService } from '../../../core/services/sprints.service';
import { SprintReport, Sprint } from '../../../core/models/interfaces';
import { TeamMetricsResponse } from '../../../core/models/interfaces';
import { VelocityChartResponse } from '../../../core/models/interfaces';
import { CumulativeFlowResponse } from '../../../core/models/interfaces';
import { ExportRequest } from '../../../core/models/interfaces';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-projects-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects-dashboard.component.html',
  styleUrl: './projects-dashboard.component.css'
})
export class ProjectsDashboardComponent implements OnInit, AfterViewInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private dashboardService = inject(DashboardService);
  private sprintsService = inject(SprintsService);
  
  projectId = signal<string>('');
  loading = signal(false);
  
  // Sprint Report Modal
  showSprintReportModal = signal(false);
  sprintReport = signal<SprintReport | null>(null);
  loadingSprintReport = signal(false);
  sprints = signal<Sprint[]>([]);
  selectedSprintId = signal<string>('');

  // Team Metrics
  teamMetrics = signal<TeamMetricsResponse | null>(null);
  loadingTeamMetrics = signal(false);
  teamMetricsPeriod = signal<number>(30);

  // Velocity Chart
  velocityChart = signal<VelocityChartResponse | null>(null);
  loadingVelocityChart = signal(false);
  velocityNumSprints = signal<number>(5);

  @ViewChild('velocityChartCanvas', { static: false }) velocityChartCanvas!: ElementRef<HTMLCanvasElement>;
  velocityChartInstance: Chart | null = null;
  private chartRendered = false;

  // Cumulative Flow Diagram
  cumulativeFlow = signal<CumulativeFlowResponse | null>(null);
  loadingCumulativeFlow = signal(false);
  cumulativeFlowDays = signal<number>(30);

  @ViewChild('cumulativeFlowCanvas', { static: false }) cumulativeFlowCanvas!: ElementRef<HTMLCanvasElement>;
  cumulativeFlowInstance: Chart | null = null;
  private cfdChartRendered = false;

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDashboardData();
        this.loadSprints();
        this.loadTeamMetrics();
        this.loadVelocityChart();
        this.loadCumulativeFlow();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chartRendered = false;
    this.cfdChartRendered = false;
  }

  ngAfterViewChecked(): void {
    if (this.velocityChart() && this.velocityChartCanvas && !this.chartRendered) {
      this.renderVelocityChart();
      this.chartRendered = true;
    }
    if (this.cumulativeFlow() && this.cumulativeFlowCanvas && !this.cfdChartRendered) {
      this.renderCumulativeFlow();
      this.cfdChartRendered = true;
    }
  }

  loadDashboardData(): void {
    this.loading.set(true);
    // TODO: Cargar datos del dashboard
    console.log('[DASHBOARD] Loading data for project:', this.projectId());
    this.loading.set(false);
  }

  loadSprints(): void {
    this.sprintsService.getSprints(this.projectId()).subscribe({
      next: (response) => {
        this.sprints.set(response.results);
        // Seleccionar el primer sprint activo o el más reciente
        if (response.results.length > 0) {
          const activeSprint = response.results.find(s => s.status === 'active') || response.results[0];
          this.selectedSprintId.set(activeSprint.id);
        }
      },
      error: (error) => {
        console.error('[DASHBOARD] Error loading sprints:', error);
      }
    });
  }

  loadTeamMetrics(): void {
    this.loadingTeamMetrics.set(true);
    this.dashboardService.getTeamMetrics(this.projectId(), this.teamMetricsPeriod()).subscribe({
      next: (metrics) => {
        this.teamMetrics.set(metrics);
        this.loadingTeamMetrics.set(false);
      },
      error: (error) => {
        console.error('[DASHBOARD] Error loading team metrics:', error);
        this.loadingTeamMetrics.set(false);
      }
    });
  }

  onTeamMetricsPeriodChange(period: number): void {
    this.teamMetricsPeriod.set(period);
    this.loadTeamMetrics();
  }

  openSprintReportModal(): void {
    if (!this.selectedSprintId()) {
      console.warn('[DASHBOARD] No sprint selected');
      return;
    }
    this.showSprintReportModal.set(true);
    this.loadSprintReport(this.selectedSprintId());
  }

  loadSprintReport(sprintId: string): void {
    this.loadingSprintReport.set(true);
    this.dashboardService.getSprintReport(sprintId).subscribe({
      next: (report) => {
        this.sprintReport.set(report);
        this.loadingSprintReport.set(false);
      },
      error: (error) => {
        console.error('[DASHBOARD] Error loading sprint report:', error);
        this.loadingSprintReport.set(false);
      }
    });
  }

  closeSprintReportModal(): void {
    this.showSprintReportModal.set(false);
    this.sprintReport.set(null);
  }

  onSprintChange(sprintId: string): void {
    this.selectedSprintId.set(sprintId);
  }

  onVelocityNumSprintsChange(num: number): void {
    this.velocityNumSprints.set(num);
    this.loadVelocityChart();
  }

  loadVelocityChart(): void {
    this.loadingVelocityChart.set(true);
    this.dashboardService.getVelocityChart(this.projectId(), this.velocityNumSprints()).subscribe({
      next: (chart) => {
        this.velocityChart.set(chart);
        this.loadingVelocityChart.set(false);
        this.chartRendered = false;
      },
      error: (error) => {
        console.error('[DASHBOARD] Error loading velocity chart:', error);
        this.loadingVelocityChart.set(false);
      }
    });
  }

  renderVelocityChart(): void {
    if (!this.velocityChart() || this.loadingVelocityChart()) {
      console.log('[DASHBOARD] Velocity chart data not ready');
      return;
    }
    
    // Usar setTimeout para asegurar que el ViewChild esté disponible
    setTimeout(() => {
      if (!this.velocityChartCanvas) {
        console.log('[DASHBOARD] Canvas element not found');
        return;
      }
      
      const ctx = this.velocityChartCanvas.nativeElement.getContext('2d');
      if (!ctx) {
        console.log('[DASHBOARD] Canvas context not available');
        return;
      }
      
      // Destruir instancia previa si existe
      if (this.velocityChartInstance) {
        this.velocityChartInstance.destroy();
      }
      
      const chartData = this.velocityChart()!;
      console.log('[DASHBOARD] Rendering velocity chart with data:', chartData);
      
      // Si no hay labels, mostrar un mensaje genérico
      const labels = chartData.labels.length > 0 ? chartData.labels : ['No sprints'];
      const velocities = chartData.velocities.length > 0 ? chartData.velocities : [0];
      const plannedPoints = chartData.planned_points.length > 0 ? chartData.planned_points : [0];
      
      this.velocityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Velocity',
              data: velocities,
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderColor: 'rgba(37, 99, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Planned Points',
              data: plannedPoints,
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: 'Velocity Chart'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
      
      console.log('[DASHBOARD] Velocity chart rendered successfully');
    }, 0);
  }

  loadCumulativeFlow(): void {
    this.loadingCumulativeFlow.set(true);
    this.dashboardService.getCumulativeFlow(this.projectId(), this.cumulativeFlowDays()).subscribe({
      next: (flow) => {
        this.cumulativeFlow.set(flow);
        this.loadingCumulativeFlow.set(false);
        this.cfdChartRendered = false;
      },
      error: (error) => {
        console.error('[DASHBOARD] Error loading cumulative flow:', error);
        this.loadingCumulativeFlow.set(false);
      }
    });
  }

  onCumulativeFlowDaysChange(days: number): void {
    this.cumulativeFlowDays.set(days);
    this.loadCumulativeFlow();
  }

  renderCumulativeFlow(): void {
    if (!this.cumulativeFlow() || this.loadingCumulativeFlow()) {
      console.log('[DASHBOARD] Cumulative flow data not ready');
      return;
    }

    setTimeout(() => {
      if (!this.cumulativeFlowCanvas) {
        console.log('[DASHBOARD] CFD Canvas element not found');
        return;
      }

      const ctx = this.cumulativeFlowCanvas.nativeElement.getContext('2d');
      if (!ctx) {
        console.log('[DASHBOARD] CFD Canvas context not available');
        return;
      }

      if (this.cumulativeFlowInstance) {
        this.cumulativeFlowInstance.destroy();
      }

      const flowData = this.cumulativeFlow()!;
      console.log('[DASHBOARD] Rendering cumulative flow with data:', flowData);

      // Preparar datasets para cada estado
      const colors = {
        'To Do': { bg: 'rgba(239, 68, 68, 0.5)', border: 'rgba(239, 68, 68, 1)' },
        'In Progress': { bg: 'rgba(59, 130, 246, 0.5)', border: 'rgba(59, 130, 246, 1)' },
        'Done': { bg: 'rgba(34, 197, 94, 0.5)', border: 'rgba(34, 197, 94, 1)' }
      };

      const datasets = Object.keys(flowData.status_counts).map(status => ({
        label: status,
        data: flowData.status_counts[status],
        backgroundColor: colors[status as keyof typeof colors]?.bg || 'rgba(156, 163, 175, 0.1)',
        borderColor: colors[status as keyof typeof colors]?.border || 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
        fill: false,  // ✅ No fill - show lines only, not area
        tension: 0.4  // ✅ Smooth curves
      }));

      this.cumulativeFlowInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: flowData.dates,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            title: {
              display: true,
              text: 'Cumulative Flow Diagram'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            x: {
              stacked: false,  // ✅ No stacking on x-axis
              ticks: {
                maxRotation: 45,
                minRotation: 45
              },
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              stacked: false,  // ✅ No stacking on y-axis - separate lines
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Issues'
              },
              ticks: {
                stepSize: 1  // ✅ Integer steps only
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });

      console.log('[DASHBOARD] Cumulative flow rendered successfully');
    }, 0);
  }

  exportDashboardData(): void {
    if (!this.projectId()) {
      console.error('[DASHBOARD] No project ID available');
      return;
    }

    const exportRequest: ExportRequest = {
      data_type: 'issues',
      project: this.projectId()
    };

    this.loading.set(true);
    this.dashboardService.exportData(exportRequest).subscribe({
      next: (response) => {
        console.log('[DASHBOARD] Export successful:', response);
        // Abrir el archivo descargado en una nueva pestaña
        if (response.download_url) {
          window.open(response.download_url, '_blank');
        }
        this.loading.set(false);
        alert(`Export completed successfully! ${response.rows_exported} rows exported.`);
      },
      error: (error) => {
        console.error('[DASHBOARD] Error exporting data:', error);
        this.loading.set(false);
        alert('Error exporting data. Please try again.');
      }
    });
  }

  exportActivityLog(): void {
    if (!this.projectId()) {
      console.error('[DASHBOARD] No project ID available');
      return;
    }

    const exportRequest: ExportRequest = {
      data_type: 'activity',
      project: this.projectId()
    };

    this.loading.set(true);
    this.dashboardService.exportData(exportRequest).subscribe({
      next: (response) => {
        console.log('[DASHBOARD] Activity export successful:', response);
        if (response.download_url) {
          window.open(response.download_url, '_blank');
        }
        this.loading.set(false);
        alert(`Activity log exported successfully! ${response.rows_exported} rows exported.`);
      },
      error: (error) => {
        console.error('[DASHBOARD] Error exporting activity log:', error);
        this.loading.set(false);
        alert('Error exporting activity log. Please try again.');
      }
    });
  }

  getObjectKeys(obj: Record<string, number>): string[] {
    return Object.keys(obj);
  }
}
