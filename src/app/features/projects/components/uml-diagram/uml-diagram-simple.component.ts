import {Component, OnInit, ViewChild, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {DiagramService} from '../../../../core/services/diagram.service';
import {MermaidGeneratorService}
  from '../../../../core/services/mermaid-generator.service';
import {GitHubIntegrationService}
  from '../../../../core/services/github-integration.service';
import {DiagramErrorStateComponent}
  from '@shared/components/diagram-error-state/diagram-error-state.component';
import {MermaidViewerComponent}
  from '../../../../shared/components/mermaid-viewer/mermaid-viewer.component';
import {DiagramErrorState, analyzeDiagramError, logDiagramError}
  from '../../../../shared/utils/diagram-error.utils';

@Component({
  selector: 'app-uml-diagram-simple',
  standalone: true,
  imports: [CommonModule, DiagramErrorStateComponent, MermaidViewerComponent],
  templateUrl: './uml-diagram-simple.component.html',
  styles: [`
    .uml-diagram-page {
      padding: 20px;
      min-height: 100vh;
      background: #f9fafb;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
      }

      .subtitle {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #6b7280;
      }
    }

    .back-btn {
      padding: 8px;
      border-radius: 6px;
      border: none;
      background: white;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #374151;
      }
    }

    .cache-badge {
      margin-left: auto;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      background: #f3f4f6;
      color: #6b7280;

      &.hit {
        background: #dbeafe;
        color: #1e40af;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      p {
        margin-top: 16px;
        color: #6b7280;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Detail panel styles (same as before) */
    .detail-panel-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 999;
    }

    .detail-panel {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100%;
      max-width: 600px;
      background: white;
      z-index: 1000;
      overflow-y: auto;
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s;
      padding: 24px;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      border: none;
      background: none;
      cursor: pointer;
      color: #9ca3af;
      padding: 4px;

      &:hover {
        color: #374151;
      }
    }

    .detail-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;

      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 700;
      }

      .module-badge {
        display: inline-block;
        padding: 2px 8px;
        font-size: 12px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 4px;
      }

      .file-path {
        margin: 8px 0 0 0;
        font-size: 11px;
        font-family: monospace;
        color: #6b7280;
      }
    }

    .detail-section {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
      }
    }

    .list-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .attribute-row,
    .method-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      font-size: 13px;

      .visibility {
        font-weight: bold;
        color: #10b981;
        min-width: 16px;
      }

      .name {
        font-weight: 600;
      }

      .type {
        color: #6b7280;
        font-size: 12px;
      }

      &.private {
        background: #fef2f2;

        .visibility {
          color: #ef4444;
        }
      }
    }

    .badge {
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 600;
      border-radius: 4px;
      margin-left: auto;

      &.pk {
        background: #dbeafe;
        color: #1e40af;
      }

      &.private-badge {
        background: #fef2f2;
        color: #991b1b;
      }
    }

    .inheritance-container {
      padding: 12px;
      background: #eff6ff;
      border-radius: 6px;

      .extends-label {
        margin: 0 0 8px 0;
        font-size: 13px;
        font-weight: 600;
        color: #1e40af;
      }

      .parent-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .parent-badge {
        padding: 4px 10px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 4px;
        font-size: 12px;
      }
    }

    .go-repo-btn {
      width: 100%;
      padding: 12px;
      margin-top: 20px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #1d4ed8;
      }
    }

    .empty {
      font-size: 13px;
      color: #9ca3af;
      font-style: italic;
    }
  `],
})
export class UMLDiagramSimpleComponent implements OnInit {
  @ViewChild(MermaidViewerComponent) mermaidViewer?: MermaidViewerComponent;

  // Data
  umlData: any | null = null;
  mermaidCode = signal<string>('');
  projectId = '';

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);
  errorState = signal<DiagramErrorState | null>(null);
  cacheStatus = signal<'HIT' | 'MISS' | null>(null);

  // Selection
  selectedClass = signal<any | null>(null);
  showDetailPanel = signal(false);

  // GitHub
  gitHubIntegration: any | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private mermaidGenerator = inject(MermaidGeneratorService);
  private githubService = inject(GitHubIntegrationService);
  constructor() {
    this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    console.log('[UML-SIMPLE] Initializing for project:', this.projectId);
    this.loadDiagram();
    this.loadGitHubIntegration();
  }

  loadDiagram(): void {
    this.isLoading.set(true);
    this.errorState.set(null);

    this.diagramService.generateUMLDiagram(this.projectId, 'json').subscribe({
      next: (response) => {
        try {
          console.log('[UML-SIMPLE] Response received');
          console.log('[UML-SIMPLE] Response type:', typeof response.data);

          // Parse cache
          if (response.cached !== undefined) {
            this.cacheStatus.set(response.cached ? 'HIT' : 'MISS');
            console.log('[UML-SIMPLE] Cache status:',
              response.cached ? 'HIT' : 'MISS');
          }

          // CRITICAL: Parse JSON if data is string
          let data: any;
          if (typeof response.data === 'string') {
            console.log('[UML-SIMPLE] Data is STRING, parsing JSON...');
            console.log('[UML-SIMPLE] String length:', response.data.length);
            console.log('[UML-SIMPLE] First 100 chars:',
                response.data.substring(0, 100));
            data = JSON.parse(response.data);
            console.log('[UML-SIMPLE] ✅ JSON parsed successfully');
          } else {
            console.log('[UML-SIMPLE] Data is already OBJECT');
            data = response.data;
          }

          // Validate parsed data
          console.log('[UML-SIMPLE] Parsed data keys:', Object.keys(data));
          console.log('[UML-SIMPLE] Classes count:', data.classes?.length || 0);
          console.log('[UML-SIMPLE] Relationships count:',
              data.relationships?.length || 0);

          if (!data.classes || data.classes.length === 0) {
            console.warn('[UML-SIMPLE] ⚠️ No classes found in data');
          }

          this.umlData = data;

          // Generate Mermaid code
          console.log('[UML-SIMPLE] Generating Mermaid syntax...');
          const mermaidSyntax = this.mermaidGenerator.generateClassDiagram(
              data.classes || [],
              data.relationships || [],
          );

          console.log('[UML-SIMPLE] Mermaid code generated');
          console.log('[UML-SIMPLE] Code length:', mermaidSyntax.length);
          console.log('[UML-SIMPLE] First 200 chars:',
              mermaidSyntax.substring(0, 200));

          // Assign to signal
          this.mermaidCode.set(mermaidSyntax);
          this.isLoading.set(false);

          console.log('[UML-SIMPLE] ✅ Diagram loaded successfully:', {
            classes: data.classes?.length || 0,
            relationships: data.relationships?.length || 0,
            mermaidCodeLength: mermaidSyntax.length,
          });

          // Trigger render after view init
          setTimeout(() => {
            console.log('[UML-SIMPLE] Triggering Mermaid render...');
            if (this.mermaidViewer) {
              this.mermaidViewer.renderMermaid();
            } else {
              console.warn('[UML-SIMPLE] ⚠️ MermaidViewer not available yet');
            }
          }, 100);
        } catch (parseError: any) {
          console.error('[UML-SIMPLE] ❌ Parse error:', parseError);
          console.error('[UML-SIMPLE] Error message:', parseError.message);
          this.errorState.set({
            type: 'NO_DATA',
            title: 'Failed to Parse Diagram',
            message: `The diagram data could not be parsed: ${
              parseError.message}`,
            icon: 'error',
            canRetry: true,
          });
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('[UML-SIMPLE] ❌ Load error:', err);
        logDiagramError('UML-SIMPLE', err);
        this.errorState.set(analyzeDiagramError(err, this.projectId));
        this.isLoading.set(false);
      },
    });
  }

  loadGitHubIntegration(): void {
    console.log('[UML-SIMPLE] Loading GitHub integration for project:',
        this.projectId);

    this.githubService.checkIntegrationStatus(this.projectId).subscribe({
      next: (integration) => {
        if (integration) {
          this.gitHubIntegration = integration;
          console.log('[UML-SIMPLE] GitHub connected:',
              integration.repository_full_name);
        } else {
          this.gitHubIntegration = null;
          console.info('[UML-SIMPLE] GitHub not connected');
        }
      },
      error: (err) => {
        console.error('[UML-SIMPLE] Error loading GitHub integration:', err);
        this.gitHubIntegration = null;
      },
    });
  }

  onClassSelected(className: string): void {
    const cls = this.umlData?.classes?.find((c: any) =>
      c.name === className ||
    c.name.replace(/[^a-zA-Z0-9_]/g, '_') === className,
    );

    if (cls) {
      this.selectedClass.set(cls);
      this.showDetailPanel.set(true);
    }
  }

  closeDetailPanel(): void {
    this.showDetailPanel.set(false);
    this.selectedClass.set(null);
  }

  goToRepo(cls: any): void {
    if (!this.gitHubIntegration) {
      alert('GitHub not connected');
      return;
    }

    const {repositoryOwner, repositoryName} = this.gitHubIntegration;
    const url = `https://github.com/${repositoryOwner}/${repositoryName
    }/blob/main/${cls.file_path}`;
    window.open(url, '_blank');
  }

  retryLoadDiagram(): void {
    this.loadDiagram();
  }

  goBack(): void {
    this.router.navigate(['../../'], {relativeTo: this.route});
  }
}
