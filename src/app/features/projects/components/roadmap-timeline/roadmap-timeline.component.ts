import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DiagramService} from '../../../../core/services/diagram.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {RoadmapDiagramData} from '../../../../core/models/interfaces';
import {DiagramErrorStateComponent}
  from '@shared/components/diagram-error-state/diagram-error-state.component';
import {DiagramErrorState, analyzeDiagramError, logDiagramError}
  from '../../../../shared/utils/diagram-error.utils';

@Component({
  selector: 'app-roadmap-timeline',
  standalone: true,
  imports: [CommonModule, DiagramErrorStateComponent],
  templateUrl: './roadmap-timeline.component.html',
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
  `],
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
    this.route.parent?.params.subscribe((params) => {
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

    console.log('[ROADMAP-TIMELINE] 📥 Loading roadmap diagram for project:',
        this.projectId());

    this.diagramService.generateRoadmapDiagram(this.projectId(), 'json')
        .subscribe({
          next: (response) => {
            console.log('[ROADMAP-TIMELINE] 📦 Response received, format:',
                response.format, 'data type:', typeof response.data);

            // Check the actual format returned by backend
            this.diagramFormat.set(response.format as 'svg' | 'json');

            if (response.format === 'svg') {
              // Backend returned SVG - sanitize and render directly
              if (typeof response.data === 'string') {
                console.log('[ROADMAP-TIMELINE] 🖼️ Rendering SVG directly');
                this.safeSvgContent.set(
                    this.sanitizer.bypassSecurityTrustHtml(response.data));
                this.diagramData.set(null);
              }
            } else if (response.format === 'json') {
              // Backend returned JSON data - handle both object and string
              try {
                const parsedData = this.parseDiagramData(response.data);
                console.log('[ROADMAP-TIMELINE] 📊 Parsed data:', {
                  type: parsedData.diagram_type,
                  sprints: parsedData.sprints?.length || 0,
                  milestones: parsedData.milestones?.length || 0,
                });

                // Validate structure
                if (!parsedData.sprints || !Array.isArray(parsedData.sprints)) {
                  console.error('[ROADMAP-TIMELINE] ❌ Invalid sprints:',
                      parsedData.sprints);
                  throw new Error('Invalid diagram data structure: ' +
                    'missing or invalid sprints array');
                }

                console.log('[ROADMAP-TIMELINE] ✅ Validation passed,' +
                  ' setting data');
                this.diagramData.set(parsedData as RoadmapDiagramData);
                this.safeSvgContent.set(null);

                // Log valid sprints for verification
                const validSprints = this.getValidSprints();
                console.log('[ROADMAP-TIMELINE] 📋 Valid sprints after filter:',
                    validSprints.length);
              } catch (parseError: any) {
                console.error('[ROADMAP-TIMELINE] ❌ Parse error:', parseError);
                console.error('[ROADMAP-TIMELINE] Raw data type:',
                    typeof response.data);
                this.errorState.set(
                    analyzeDiagramError(parseError, this.projectId()));
              }
            }

            this.loading.set(false);
          },
          error: (error) => {
            logDiagramError('ROADMAP-TIMELINE', error);
            const errorInfo = analyzeDiagramError(error, this.projectId());
            this.errorState.set(errorInfo);
            this.loading.set(false);
          },
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

    if (typeof data === 'object') {
      console.log('[ROADMAP-TIMELINE] ✅ Data is object (backend clean format)');
      return data;
    }

    if (typeof data === 'string') {
      console.log('[ROADMAP-TIMELINE] 📝 Data is string ' +
        '(legacy format), parsing with JSON.parse');
      console.log('[ROADMAP-TIMELINE] First 100 chars:',
          data.substring(0, 100));
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

    return data.sprints.filter((sprint) => {
      // Filter out null or undefined sprints
      if (!sprint) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Null sprint found, skipping');
        return false;
      }

      // Validate required fields exist
      if (!sprint.id || !sprint.name) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint missing id or name:',
            sprint);
        return false;
      }

      // Validate dates exist
      if (!sprint.start_date || !sprint.end_date) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint missing dates:',
            sprint.id, sprint.name);
        return false;
      }

      // Try to parse dates to ensure they're valid
      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint has invalid dates:',
            sprint.id, sprint.start_date, sprint.end_date);
        return false;
      }

      // Ensure end date is after start date
      if (endDate < startDate) {
        console.warn('[ROADMAP-TIMELINE] ⚠️ Sprint end date before start date:',
            sprint.id);
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
