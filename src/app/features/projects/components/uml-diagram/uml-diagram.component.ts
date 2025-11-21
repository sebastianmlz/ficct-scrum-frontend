import {Component, inject, OnInit, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DiagramService} from '../../../../core/services/diagram.service';
import {NotificationService}
  from '../../../../core/services/notification.service';
import {GitHubIntegrationService}
  from '../../../../core/services/github-integration.service';
import {UMLDiagramData, GitHubIntegration}
  from '../../../../core/models/interfaces';

// Interface para los datos REALES del backend
interface ClassInfo {
  name: string;
  file_path?: string;
  module?: string;
  attributes?: { name: string; type?: string; visibility?: string }[];
  methods?: { name: string; visibility?: string; parameters?: any[];
    return_type?: string }[];
  parent_classes?: string[];
}

@Component({
  selector: 'app-uml-diagram',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './uml-diagram.component.html',
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .diagram-svg-container svg {
      max-width: 100%;
      height: auto;
      display: block;
    }

    /* GRID DE CARDS */
    .classes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .class-card {
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .class-card:hover {
      border-color: #2563eb;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
      transform: translateY(-2px);
    }

    .class-card.selected {
      border-color: #2563eb;
      border-width: 2px;
      background: #eff6ff;
    }

    .class-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .class-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      word-break: break-word;
    }

    .module-badge {
      font-size: 0.6875rem;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      white-space: nowrap;
      font-weight: 500;
    }

    .class-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .methods-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .methods-list {
      list-style: none;
      padding-left: 0;
      margin: 0.5rem 0 0 0;
      font-size: 0.8125rem;
    }

    .methods-list li {
      margin: 0.25rem 0;
      color: #4b5563;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .methods-list li.visibility-private {
      color: #991b1b;
    }

    .private-badge {
      font-size: 0.6875rem;
      color: #9ca3af;
      font-style: italic;
      margin-left: 0.25rem;
    }

    .more-methods {
      color: #2563eb !important;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .parent-class {
      font-size: 0.8125rem;
      color: #6b7280;
      padding-top: 0.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .btn-small {
      flex: 1;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid;
    }

    .btn-primary {
      background: white;
      color: #2563eb;
      border-color: #2563eb;
    }

    .btn-primary:hover {
      background: #2563eb;
      color: white;
    }

    .btn-secondary {
      background: white;
      color: #059669;
      border-color: #059669;
    }

    .btn-secondary:hover {
      background: #059669;
      color: white;
    }

    /* PAGINATION */
    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .pagination-btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #2563eb;
      color: #2563eb;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
    }

    /* WARNING BANNER */
    .warning-banner {
      margin-bottom: 1.5rem;
      border-radius: 0.5rem;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 1rem;
    }

    .warning-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .warning-icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      color: #f59e0b;
    }

    .warning-text {
      flex: 1;
    }

    .warning-title {
      font-weight: 600;
      color: #92400e;
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
    }

    .warning-description {
      color: #78350f;
      font-size: 0.8125rem;
      margin: 0;
    }

    .warning-action {
      flex-shrink: 0;
      padding: 0.5rem 1rem;
      background: #f59e0b;
      color: white;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.2s;
    }

    .warning-action:hover {
      background: #d97706;
    }

    /* DISABLED BUTTONS */
    .btn-small:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #e5e7eb;
      color: #9ca3af;
      border-color: #d1d5db;
    }

    .btn-small:disabled:hover {
      background: #e5e7eb;
      color: #9ca3af;
      transform: none;
    }
  `],
})
export class UMLDiagramComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagramService = inject(DiagramService);
  private notificationService = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  private githubService = inject(GitHubIntegrationService);

  projectId = signal<string>('');
  diagramData = signal<UMLDiagramData | null>(null);
  safeSvgContent = signal<SafeHtml | null>(null);
  diagramFormat = signal<'svg' | 'json'>('json');
  loading = signal(false);
  diagramType: 'class' | 'sequence' | 'activity' | 'component' = 'class';
  selectedClass = signal<ClassInfo | null>(null);

  // Datos reales parseados del backend
  allClasses = signal<ClassInfo[]>([]);
  filteredClasses = signal<ClassInfo[]>([]);
  totalClasses = signal(0);
  totalRelationships = signal(0);

  // GitHub Integration (dinámico)
  gitHubIntegration = signal<GitHubIntegration | null>(null);
  loadingGitHub = signal(false);

  // Filtros y búsqueda
  searchQuery = '';
  selectedModule = '';

  // Paginación
  currentPage = signal(1);
  itemsPerPage = 9; // Grid 3x3

  // Computed signals
  uniqueModules = computed(() => {
    return [...new Set(this.allClasses().map((c) => c.module).filter((m) => m))]
        .sort();
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredClasses().length / this.itemsPerPage);
  });

  paginatedClasses = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredClasses().slice(start, end);
  });

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadGitHubIntegration(); // Cargar integración primero
        this.loadDiagram();
      }
    });
  }

  loadGitHubIntegration(): void {
    if (!this.projectId()) return;

    this.loadingGitHub.set(true);
    console.log('[UML-DIAGRAM] Loading GitHub integration for project:',
        this.projectId());

    this.githubService.checkIntegrationStatus(this.projectId()).subscribe({
      next: (integration) => {
        this.gitHubIntegration.set(integration);
        this.loadingGitHub.set(false);

        if (integration) {
          console.log('[UML-DIAGRAM] ✅ GitHub integration found:', {
            fullName: integration.repository_full_name,
            url: integration.repository_url,
          });
        } else {
          console.log(
              '[UML-DIAGRAM] ⚠️ No GitHub integration found for project');
        }
      },
      error: (err) => {
        console.warn('[UML-DIAGRAM] GitHub integration error:', err);
        this.gitHubIntegration.set(null);
        this.loadingGitHub.set(false);
      },
    });
  }

  loadDiagram(): void {
    this.loading.set(true);
    this.safeSvgContent.set(null);
    this.allClasses.set([]);

    console.log('[UML-DIAGRAM] Loading diagram for project:', this.projectId());

    this.diagramService.generateUMLDiagram(this.projectId(), 'json',
        {diagram_type: this.diagramType}).subscribe({
      next: (response) => {
        console.log('[UML-DIAGRAM] Response received:', response);
        this.diagramFormat.set(response.format as 'svg' | 'json');

        if (response.format === 'svg') {
          // Backend returned SVG - sanitize and render directly
          if (typeof response.data === 'string') {
            this.safeSvgContent
                .set(this.sanitizer.bypassSecurityTrustHtml(response.data));
          }
          this.loading.set(false);
        } else if (response.format === 'json') {
          // Backend returned JSON data - PARSE REAL STRUCTURE
          this.parseAndRenderDiagram(response.data);
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('[UML-DIAGRAM] Error loading diagram:', error);
        this.notificationService.error('Failed to generate UML diagram');
        this.loading.set(false);
      },
    });
  }

  parseAndRenderDiagram(data: any): void {
    console.log('[UML-DIAGRAM] Parsing diagram data...');

    // Parse JSON si es string
    let jsonData;
    try {
      if (typeof data === 'string') {
        jsonData = JSON.parse(data);
      } else {
        jsonData = data;
      }
    } catch (e) {
      console.error('[UML-DIAGRAM] ❌ Error parsing JSON:', e);
      this.notificationService.error('Invalid diagram data');
      return;
    }

    console.log('[UML-DIAGRAM] Parsed data:', jsonData);

    const classes = jsonData.classes || [];
    this.allClasses.set(classes);
    this.totalClasses.set(jsonData.metadata?.total_classes || classes.length);
    this.totalRelationships.set(jsonData.metadata?.total_relationships ||
      jsonData.relationships?.length || 0);

    console.log('[UML-DIAGRAM] ✅ Parsed', classes.length, 'classes');
    console.log('[UML-DIAGRAM] First class sample:', classes[0]);

    // Aplicar filtros iniciales
    this.applyFilters();
  }

  exportDiagram(): void {
    this.diagramService.exportAsPNG('uml', this.projectId()).subscribe({
      next: (response) => {
        if (typeof response.data === 'string') {
          this.diagramService
              .downloadBase64Image(response.data, 'uml-diagram.png');
          this.notificationService.success('Diagram exported');
        }
      },
      error: () => this.notificationService.error('Export failed'),
    });
  }

  goBack(): void {
    this.router.navigate(['/projects', this.projectId()]);
  }

  // Filtrado y búsqueda
  applyFilters(): void {
    let filtered = [...this.allClasses()];

    // Filtrar por búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter((cls) =>
        cls.name.toLowerCase().includes(query) ||
        cls.module?.toLowerCase().includes(query),
      );
    }

    // Filtrar por módulo
    if (this.selectedModule) {
      filtered = filtered.filter((cls) => cls.module === this.selectedModule);
    }

    this.filteredClasses.set(filtered);
    this.currentPage.set(1); // Reset to first page
    console.log('[UML-DIAGRAM] Filters applied:',
        filtered.length, 'classes match');
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedModule = '';
    this.applyFilters();
    console.log('[UML-DIAGRAM] Filters cleared');
  }

  // Paginación
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      console.log('[UML-DIAGRAM] Next page:', this.currentPage());
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      console.log('[UML-DIAGRAM] Previous page:', this.currentPage());
    }
  }

  // Acciones de clase
  selectClass(cls: ClassInfo): void {
    this.selectedClass.set(cls);
    console.log('[UML-DIAGRAM] Selected class:', cls.name, cls);
  }

  viewDetails(cls: ClassInfo): void {
    this.selectClass(cls);
    // TODO: Mostrar panel lateral con detalles completos
    console.log('[UML-DIAGRAM] View details for:', cls.name);
  }

  goToRepo(cls: ClassInfo): void {
    // Validar que GitHub integration existe
    const integration = this.gitHubIntegration();
    if (!integration) {
      console.warn('[UML-DIAGRAM] ⚠️ GitHub repository not connected');
      this.notificationService.error(
          'GitHub not connected',
          'Please configure GitHub integration in project settings',
      );
      return;
    }

    if (!cls.file_path) {
      console.warn('[UML-DIAGRAM] ⚠️ No file path available for class:',
          cls.name);
      return;
    }

    // Construir URL DINÁMICAMENTE usando repository_full_name
    // Formato: https://github.com/{owner}/{repo}/blob/main/{file_path}
    const url = `https://github.com/${integration.repository_full_name}/blob/main/${cls.file_path}`;

    console.log('[UML-DIAGRAM] Opening file from GitHub:', {
      repository: integration.repository_full_name,
      file: cls.file_path,
      fullUrl: url,
    });

    window.open(url, '_blank');
  }

  // Helper methods para rendering
  getInitials(className: string): string {
    if (!className) return '??';
    return className
        .split(/[\s_-]|(?=[A-Z])/)
        .filter((word) => word.length > 0)
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
  }

  getVisibilityIcon(visibility?: string): string {
    if (!visibility) return '🟢'; // Default public
    switch (visibility.toLowerCase()) {
      case 'public': return '🟢';
      case 'private': return '🔴';
      case 'protected': return '🟡';
      default: return '⚪';
    }
  }

  getVisibilityTitle(visibility?: string): string {
    if (!visibility) return 'Public visibility';
    return `${visibility.charAt(0).toUpperCase() + visibility.slice(1)
    } visibility`;
  }

  getParametersString(parameters: any[]): string {
    if (!parameters || parameters.length === 0) return '';
    return parameters
        .map((p) => `${p.name || '?'}: ${p.type || 'any'}`)
        .join(', ');
  }
}
