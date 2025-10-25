import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramService } from '../../../../core/services/diagram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RoadmapDiagramData } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-roadmap-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button type="button" (click)="goBack()" class="p-2 rounded-md text-gray-400 hover:text-gray-500">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <h1 class="text-2xl font-bold text-gray-900">Roadmap Timeline</h1>
            </div>
            <button (click)="exportDiagram()" [disabled]="loading()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              Export
            </button>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          } @else if (diagramData()) {
            <div class="space-y-6">
              <div class="text-sm text-gray-600">
                <strong>Timeline:</strong> 
                {{ diagramData()!.timeline.start_date | date:'mediumDate' }} - 
                {{ diagramData()!.timeline.end_date | date:'mediumDate' }}
              </div>
              
              @for (sprint of diagramData()!.sprints; track sprint.id) {
                <div class="border rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-gray-900">{{ sprint.name }}</h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          [class.bg-green-100]="sprint.status === 'completed'"
                          [class.text-green-800]="sprint.status === 'completed'"
                          [class.bg-blue-100]="sprint.status === 'active'"
                          [class.text-blue-800]="sprint.status === 'active'"
                          [class.bg-gray-100]="sprint.status === 'planned'"
                          [class.text-gray-800]="sprint.status === 'planned'">
                      {{ sprint.status }}
                    </span>
                  </div>
                  
                  <div class="text-xs text-gray-500 mb-2">
                    {{ sprint.start_date | date:'shortDate' }} - {{ sprint.end_date | date:'shortDate' }}
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div class="bg-blue-600 h-2.5 rounded-full" [style.width.%]="sprint.progress"></div>
                  </div>
                  
                  <div class="text-xs text-gray-600">
                    {{ sprint.progress }}% complete
                    @if (sprint.committed_points) {
                      • {{ sprint.completed_points }}/{{ sprint.committed_points }} points
                    }
                    • {{ sprint.issues.length }} issues
                  </div>
                </div>
              }

              @if (diagramData()!.milestones && diagramData()!.milestones.length > 0) {
                <div class="border-t pt-4">
                  <h3 class="font-medium text-gray-900 mb-3">Milestones</h3>
                  <div class="space-y-2">
                    @for (milestone of diagramData()!.milestones; track milestone.date) {
                      <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0">
                          @if (milestone.achieved) {
                            <svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                          } @else {
                            <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>
                            </svg>
                          }
                        </div>
                        <div class="flex-1">
                          <div class="text-sm font-medium text-gray-900">{{ milestone.title }}</div>
                          <div class="text-xs text-gray-500">{{ milestone.date | date:'mediumDate' }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No roadmap available</h3>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class RoadmapTimelineComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  diagramData = signal<RoadmapDiagramData | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDiagram();
      }
    });
  }

  loadDiagram(): void {
    this.loading.set(true);
    this.diagramService.generateRoadmapDiagram(this.projectId(), 'json').subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramData.set(JSON.parse(response.data));
        } else {
          this.diagramData.set(response.data as RoadmapDiagramData);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Failed to generate roadmap');
        this.loading.set(false);
      }
    });
  }

  exportDiagram(): void {
    this.diagramService.exportAsPNG('roadmap', this.projectId()).subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramService.downloadBase64Image(response.data, 'roadmap.png');
          this.notificationService.success('Roadmap exported');
        }
      },
      error: () => this.notificationService.error('Export failed')
    });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }
}
