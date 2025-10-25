import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramService } from '../../../../core/services/diagram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DependencyDiagramData } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-dependency-graph',
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
              <h1 class="text-2xl font-bold text-gray-900">Dependency Graph</h1>
            </div>
            <button (click)="exportDiagram()" [disabled]="loading()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Generating dependency graph...</p>
              </div>
            </div>
          } @else if (diagramData()) {
            <div class="mb-4">
              <p class="text-sm text-gray-600">Issue dependencies and critical path visualization</p>
            </div>
            <div class="dependency-visualization bg-gray-50 rounded-lg p-8 min-h-[500px] flex items-center justify-center border-2 border-dashed border-gray-300">
              <div class="text-center">
                <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <p class="mt-4 text-lg font-medium text-gray-900">{{ diagramData()!.nodes.length }} Issues</p>
                <p class="text-sm text-gray-500">{{ diagramData()!.links.length }} Dependencies</p>
                @if (diagramData()!.critical_path && diagramData()!.critical_path!.length > 0) {
                  <p class="mt-2 text-sm text-blue-600 font-medium">Critical Path: {{ diagramData()!.critical_path!.length }} issues</p>
                }
              </div>
            </div>
          } @else {
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No diagram available</h3>
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
export class DependencyGraphComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  diagramData = signal<DependencyDiagramData | null>(null);
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
    this.diagramService.generateDependencyDiagram(this.projectId(), 'json').subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramData.set(JSON.parse(response.data));
        } else {
          this.diagramData.set(response.data as DependencyDiagramData);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Failed to generate dependency graph');
        this.loading.set(false);
      }
    });
  }

  exportDiagram(): void {
    this.diagramService.exportAsPNG('dependency', this.projectId()).subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramService.downloadBase64Image(response.data, 'dependency-graph.png');
          this.notificationService.success('Diagram exported');
        }
      },
      error: () => this.notificationService.error('Export failed')
    });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }
}
