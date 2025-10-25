import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiagramService } from '../../../../core/services/diagram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UMLDiagramData } from '../../../../core/models/interfaces';

@Component({
  selector: 'app-uml-diagram',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
              <h1 class="text-2xl font-bold text-gray-900">UML Diagrams</h1>
            </div>
            <div class="flex items-center space-x-3">
              <select [(ngModel)]="diagramType" (change)="loadDiagram()" class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="class">Class Diagram</option>
                <option value="sequence">Sequence Diagram</option>
                <option value="activity">Activity Diagram</option>
                <option value="component">Component Diagram</option>
              </select>
              <button (click)="exportDiagram()" [disabled]="loading()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                Export
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          } @else if (diagramData()) {
            <div class="space-y-4">
              <div class="text-sm text-gray-600">
                <strong>Type:</strong> {{ diagramData()!.diagram_type }}
              </div>
              
              @if (diagramData()!.mermaid_code) {
                <div class="border rounded-lg p-4 bg-gray-50">
                  <h3 class="font-medium text-gray-900 mb-2">Mermaid Code</h3>
                  <pre class="text-xs text-gray-700 overflow-x-auto">{{ diagramData()!.mermaid_code }}</pre>
                </div>
              }

              @if (diagramData()!.classes && diagramData()!.classes!.length > 0) {
                <div class="border rounded-lg p-4">
                  <h3 class="font-medium text-gray-900 mb-3">Classes ({{ diagramData()!.classes!.length }})</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (cls of diagramData()!.classes; track cls.id) {
                      <div class="border rounded p-3 bg-blue-50">
                        <div class="font-medium text-blue-900">{{ cls.name }}</div>
                        @if (cls.package) {
                          <div class="text-xs text-blue-700">{{ cls.package }}</div>
                        }
                        <div class="mt-2 text-xs text-gray-600">
                          {{ cls.properties.length }} properties • {{ cls.methods.length }} methods
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (diagramData()!.relationships && diagramData()!.relationships!.length > 0) {
                <div class="border rounded-lg p-4">
                  <h3 class="font-medium text-gray-900 mb-3">Relationships ({{ diagramData()!.relationships!.length }})</h3>
                  <div class="space-y-2">
                    @for (rel of diagramData()!.relationships; track rel.from + rel.to) {
                      <div class="flex items-center text-sm text-gray-700">
                        <span class="font-medium">{{ rel.from }}</span>
                        <span class="mx-2 text-gray-400">{{ rel.type }}</span>
                        <span class="font-medium">{{ rel.to }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <div class="rounded-lg p-8 bg-gray-50 border-2 border-dashed border-gray-300 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                </svg>
                <p class="mt-2 text-sm text-gray-600">Visual diagram rendering coming soon</p>
                <p class="text-xs text-gray-500">Use Mermaid code or PlantUML for now</p>
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
export class UMLDiagramComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);

  projectId = signal<string>('');
  diagramData = signal<UMLDiagramData | null>(null);
  loading = signal(false);
  diagramType: 'class' | 'sequence' | 'activity' | 'component' = 'class';

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
    this.diagramService.generateUMLDiagram(this.projectId(), 'json', { diagram_type: this.diagramType }).subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramData.set(JSON.parse(response.data));
        } else {
          this.diagramData.set(response.data as UMLDiagramData);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Failed to generate UML diagram');
        this.loading.set(false);
      }
    });
  }

  exportDiagram(): void {
    this.diagramService.exportAsPNG('uml', this.projectId()).subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramService.downloadBase64Image(response.data, 'uml-diagram.png');
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
