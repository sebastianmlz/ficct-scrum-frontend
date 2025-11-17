import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DiagramService } from '../../../../core/services/diagram.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RoadmapDiagramData, DiagramFormat } from '../../../../core/models/interfaces';
import { DiagramErrorStateComponent } from '../../../../shared/components/diagram-error-state/diagram-error-state.component';
import { DiagramErrorState, analyzeDiagramError, logDiagramError } from '../../../../shared/utils/diagram-error.utils';

@Component({
  selector: 'app-roadmap-timeline',
  standalone: true,
  imports: [CommonModule, DiagramErrorStateComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="mb-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center space-x-3">
              <button type="button" (click)="goBack()" class="p-2 rounded-md text-gray-400 hover:text-gray-500">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Roadmap Timeline</h1>
            </div>
            <!-- No action buttons in header, controls are in floating panel -->
          </div>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden" style="position: relative;">
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Generating roadmap...</p>
              </div>
            </div>
          } @else if (errorState()) {
            <!-- Error State -->
            <div class="p-6">
              <app-diagram-error-state [errorState]="errorState()!" (retry)="retryLoadDiagram()"></app-diagram-error-state>
            </div>
          } @else if (safeSvgContent()) {
            <!-- SVG Content (rendered by backend) -->
            <div class="p-4 md:p-6">
              <div class="mb-4">
                <p class="text-sm text-gray-600">
                  Sprint timeline and milestone roadmap visualization.
                </p>
              </div>
              <div class="w-full mx-auto bg-gray-50 rounded-lg p-4">
                <div class="diagram-svg-container" [innerHTML]="safeSvgContent()"></div>
              </div>
            </div>
          } @else if (diagramData()) {
            <!-- JSON Data Visualization -->
            <div class="p-6 space-y-6" style="position: relative;">
              
              <!-- Floating Controls -->
              <div style="position: absolute; top: 20px; right: 20px; z-index: 10;">
                <div style="display: flex; align-items: center; gap: 8px; background: white; border-radius: 8px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 1px solid #DFE1E6;">
                  <!-- Refresh -->
                  <button (click)="refreshDiagram()" [disabled]="loading()" title="Refresh"
                          style="display: flex; align-items: center; padding: 8px; background: transparent; border: none; border-radius: 4px; cursor: pointer; color: #42526E;"
                          class="hover:bg-gray-100">
                    <svg class="w-5 h-5" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              @if (diagramData()?.metadata) {
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="text-sm font-semibold text-blue-900 mb-1">{{ diagramData()!.metadata.project_name }}</h3>
                      <p class="text-xs text-blue-700">
                        <strong>Timeline:</strong> 
                        {{ diagramData()!.metadata.start_date | date:'mediumDate' }} - 
                        {{ diagramData()!.metadata.end_date | date:'mediumDate' }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-blue-700"><strong>Today:</strong> {{ diagramData()!.metadata.today | date:'shortDate' }}</p>
                      <p class="text-xs text-blue-700 mt-1"><strong>Sprints:</strong> {{ diagramData()!.metadata.sprint_count }}</p>
                    </div>
                  </div>
                </div>
              }
              
              @for (sprint of getValidSprints(); track sprint.id) {
                <div class="border-l-4 border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                     [style.border-left-color]="sprint.color || '#6B7280'">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-gray-900">{{ sprint.name }}</h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          [class.bg-green-100]="sprint.status === 'completed'"
                          [class.text-green-800]="sprint.status === 'completed'"
                          [class.bg-blue-100]="sprint.status === 'active'"
                          [class.text-blue-800]="sprint.status === 'active'"
                          [class.bg-gray-100]="sprint.status === 'planned'"
                          [class.text-gray-800]="sprint.status === 'planned'">
                      {{ sprint.status | uppercase }}
                    </span>
                  </div>
                  
                  <div class="flex items-center text-xs text-gray-500 mb-3">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {{ sprint.start_date | date:'shortDate' }} - {{ sprint.end_date | date:'shortDate' }}
                  </div>
                  
                  <div class="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div class="h-3 rounded-full transition-all duration-300" 
                         [style.width.%]="sprint.progress"
                         [style.background-color]="sprint.color || '#3B82F6'"></div>
                  </div>
                  
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-600 font-medium">{{ sprint.progress }}% complete</span>
                    <span class="text-gray-600">
                      <span class="font-semibold text-gray-900">{{ sprint.completed_count }}</span>/{{ sprint.issue_count }} issues
                    </span>
                  </div>
                  
                  @if (sprint.velocity !== null && sprint.velocity !== undefined) {
                    <div class="mt-2 pt-2 border-t border-gray-100">
                      <div class="flex items-center text-xs text-gray-600">
                        <svg class="h-4 w-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                        <span>Velocity: <strong class="text-purple-600">{{ sprint.velocity }}</strong></span>
                      </div>
                    </div>
                  }
                </div>
              }

              @if (diagramData()!.milestones && diagramData()!.milestones.length > 0) {
                <div class="border-t pt-6 mt-6">
                  <h3 class="font-semibold text-gray-900 mb-4 flex items-center">
                    <svg class="h-5 w-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    Milestones
                  </h3>
                  <div class="space-y-3">
                    @for (milestone of diagramData()!.milestones; track milestone.id) {
                      <div class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div class="flex-shrink-0 mt-0.5">
                          <div class="h-3 w-3 rounded-full" [style.background-color]="milestone.color || '#10B981'"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between">
                            <div class="text-sm font-semibold text-gray-900">{{ milestone.name || milestone.title }}</div>
                            @if (milestone.achieved) {
                              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <svg class="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                Achieved
                              </span>
                            }
                          </div>
                          <div class="flex items-center mt-1 text-xs text-gray-500">
                            <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {{ milestone.date | date:'mediumDate' }}
                          </div>
                          @if (milestone.description) {
                            <div class="text-xs text-gray-500 mt-1 italic">{{ milestone.description }}</div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Empty State -->
            <div class="p-6 text-center py-12">
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
    
    /* CRITICAL: Container sizing and horizontal scroll for roadmap */
    .diagram-svg-container {
      position: relative;
      min-height: 500px;
      width: 100%;
      overflow-x: auto; /* Enable horizontal scroll for wide timelines */
      overflow-y: visible;
      background: #ffffff;
      border-radius: 8px;
      padding: 16px;
      -webkit-overflow-scrolling: touch;
    }
    
    .diagram-svg-container svg {
      width: 100% !important;
      max-width: none !important; /* Allow SVG to be wider than container */
      min-width: 100%;
      height: auto !important;
      display: block !important;
    }
    
    /* CRITICAL: Override backend SVG text styling for visibility */
    .diagram-svg-container svg text {
      fill: #172B4D !important; /* Backend primary text color */
      font-weight: 600 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important; /* Minimum font size */
      paint-order: stroke fill !important;
      stroke: #ffffff !important;
      stroke-width: 2px !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
    }
    
    .diagram-svg-container svg tspan {
      fill: #172B4D !important;
      stroke: #ffffff !important;
      stroke-width: 2px !important;
      font-size: 12px !important;
    }
    
    /* Text inside dark sprint bars needs white fill */
    .diagram-svg-container svg rect[fill*="#00"] ~ text,
    .diagram-svg-container svg rect[fill*="#5E"] ~ text,
    .diagram-svg-container svg rect[fill*="#00875A"] ~ text,
    .diagram-svg-container svg rect[fill*="#0052CC"] ~ text,
    .diagram-svg-container svg rect[fill*="#DE350B"] ~ text,
    .diagram-svg-container svg rect[fill*="#FF991F"] ~ text,
    .diagram-svg-container svg rect[fill*="#00"] ~ g text,
    .diagram-svg-container svg rect[fill*="#5E"] ~ g text {
      fill: #ffffff !important;
      stroke: rgba(0, 0, 0, 0.3) !important;
      stroke-width: 1px !important;
    }
    
    .diagram-svg-container svg rect,
    .diagram-svg-container svg circle,
    .diagram-svg-container svg ellipse,
    .diagram-svg-container svg polygon {
      stroke-width: 2px !important;
    }
    
    .diagram-svg-container svg rect[fill*="#"] {
      stroke: rgba(0, 0, 0, 0.15) !important;
    }
    
    .diagram-svg-container svg line,
    .diagram-svg-container svg polyline,
    .diagram-svg-container svg path[stroke] {
      stroke: #6b7280 !important;
      stroke-width: 2px !important;
    }
    
    /* Enhance contrast */
    .diagram-svg-container svg {
      filter: contrast(1.05) brightness(1.02);
    }
    
    /* Sprint bars should have proper spacing */
    .diagram-svg-container svg rect[fill*="#00875A"],
    .diagram-svg-container svg rect[fill*="#0052CC"],
    .diagram-svg-container svg rect[fill*="#FF991F"] {
      rx: 4;
      ry: 4;
    }
  `]
})
export class RoadmapTimelineComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);

  projectId = signal<string>('');
  diagramData = signal<RoadmapDiagramData | null>(null);
  safeSvgContent = signal<SafeHtml | null>(null);
  diagramFormat = signal<'svg' | 'json'>('json');
  errorState = signal<DiagramErrorState | null>(null);
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
    this.errorState.set(null);
    this.safeSvgContent.set(null);
    this.diagramData.set(null);
    
    console.log('[ROADMAP-TIMELINE] 📥 Loading roadmap diagram for project:', this.projectId());
    
    this.diagramService.generateRoadmapDiagram(this.projectId(), 'json').subscribe({
      next: (response) => {
        console.log('[ROADMAP-TIMELINE] 📦 Response received, format:', response.format, 'data type:', typeof response.data);
        
        // Check the actual format returned by backend
        this.diagramFormat.set(response.format as 'svg' | 'json');
        
        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            console.log('[ROADMAP-TIMELINE] 🖼️ Rendering SVG directly');
            this.safeSvgContent.set(this.sanitizer.bypassSecurityTrustHtml(response.data));
            this.diagramData.set(null);
          }
        } else if (response.format === 'json') {
          // Backend returned JSON data - handle both object and string
          try {
            const parsedData = this.parseDiagramData(response.data);
            console.log('[ROADMAP-TIMELINE] 📊 Parsed data:', {
              type: parsedData.diagram_type,
              sprints: parsedData.sprints?.length || 0,
              milestones: parsedData.milestones?.length || 0
            });
            
            // Validate structure
            if (!parsedData.sprints || !Array.isArray(parsedData.sprints)) {
              console.error('[ROADMAP-TIMELINE] ❌ Invalid sprints:', parsedData.sprints);
              throw new Error('Invalid diagram data structure: missing or invalid sprints array');
            }
            
            console.log('[ROADMAP-TIMELINE] ✅ Validation passed, setting data');
            this.diagramData.set(parsedData as RoadmapDiagramData);
            this.safeSvgContent.set(null);
            
            // Log valid sprints for verification
            const validSprints = this.getValidSprints();
            console.log('[ROADMAP-TIMELINE] 📋 Valid sprints after filter:', validSprints.length);
            
          } catch (parseError: any) {
            console.error('[ROADMAP-TIMELINE] ❌ Parse error:', parseError);
            console.error('[ROADMAP-TIMELINE] Raw data type:', typeof response.data);
            this.errorState.set(analyzeDiagramError(parseError, this.projectId()));
          }
        }
        
        this.loading.set(false);
      },
      error: (error) => {
        logDiagramError('ROADMAP-TIMELINE', error);
        const errorInfo = analyzeDiagramError(error, this.projectId());
        this.errorState.set(errorInfo);
        this.loading.set(false);
      }
    });
  }

  /**
   * Parse diagram data - handles both object and string from backend
   * UPDATED: Backend now returns clean objects (not JSON strings)
   */
  private parseDiagramData(data: any): any {
    console.log('[ROADMAP-TIMELINE] 🔍 Parsing data, type:', typeof data);
    
    if (data === null || data === undefined) {
      throw new Error('Diagram data is null or undefined');
    }
    
    // NEW: If data is already an object, return it directly (backend sends clean objects now)
    if (typeof data === 'object') {
      console.log('[ROADMAP-TIMELINE] ✅ Data is object (backend clean format)');
      return data;
    }
    
    // BACKWARD COMPATIBLE: If data is a string, parse it as JSON (for transition period)
    if (typeof data === 'string') {
      console.log('[ROADMAP-TIMELINE] 📝 Data is string (legacy format), parsing with JSON.parse');
      console.log('[ROADMAP-TIMELINE] First 100 chars:', data.substring(0, 100));
      try {
        const parsed = JSON.parse(data);
        console.log('[ROADMAP-TIMELINE] ✅ Successfully parsed JSON string');
        return parsed;
      } catch (error: any) {
        console.error('[ROADMAP-TIMELINE] ❌ JSON parse failed:', error.message);
        throw new Error(`Failed to parse diagram JSON: ${error.message}`);
      }
    }
    
    throw new Error(`Unsupported data type: ${typeof data}`);
  }

  /**
   * Get valid sprints with proper date validation
   */
  getValidSprints(): any[] {
    const data = this.diagramData();
    if (!data || !data.sprints || !Array.isArray(data.sprints)) {
      return [];
    }

    return data.sprints.filter(sprint => {
      // Filter out null or undefined sprints
      if (!sprint) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Null sprint found, skipping');
        return false;
      }

      // Validate required fields exist
      if (!sprint.id || !sprint.name) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint missing id or name:', sprint);
        return false;
      }

      // Validate dates exist
      if (!sprint.start_date || !sprint.end_date) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint missing dates:', sprint.id, sprint.name);
        return false;
      }

      // Try to parse dates to ensure they're valid
      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint has invalid dates:', sprint.id, sprint.start_date, sprint.end_date);
        return false;
      }

      // Ensure end date is after start date
      if (endDate < startDate) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint end date before start date:', sprint.id);
        return false;
      }

      return true;
    });
  }

  retryLoadDiagram(): void {
    this.loadDiagram();
  }


  refreshDiagram(): void {
    console.log('[ROADMAP-TIMELINE] 🔄 Refreshing roadmap with force_refresh');
    // Clear current diagram
    this.safeSvgContent.set(null);
    this.diagramData.set(null);
    
    // Reload roadmap
    this.loadDiagram();
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }
}
