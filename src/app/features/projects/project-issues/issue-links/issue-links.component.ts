import {Component, Input, OnInit, signal, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {IssueService} from '../../../../core/services/issue.service';
import {IssueLink, IssueLinkRequest, PaginatedIssueLinkList, Issue, PaginatedIssueList} from '../../../../core/models/interfaces';
import {IssueLinkTypeEnum} from '../../../../core/models/enums';
import {IssueLinkDetailComponent} from './issue-link-detail/issue-link-detail.component';

@Component({
  selector: 'app-issue-links',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IssueLinkDetailComponent],
  templateUrl: './issue-links.component.html',
  styleUrl: './issue-links.component.css',
})
export class IssueLinksComponent implements OnInit {
  @Input() issueId!: string;
  @Input() projectId!: string;
  @Input() currentIssue?: Issue;

  private issueService = inject(IssueService);
  private fb = inject(FormBuilder);

  // Signals
  links = signal<IssueLink[]>([]);
  projectIssues = signal<Issue[]>([]);
  loading = signal(false);
  loadingIssues = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  showCreateForm = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  totalLinks = signal(0);
  filteredIssues = signal<Issue[]>([]);
  issueSearchTerm = signal('');

  // Modal de detalle
  showDetailModal = signal(false);
  selectedLinkId = signal<string | null>(null);

  // Available link types
  LINK_TYPES = [
    {value: IssueLinkTypeEnum.BLOCKS, label: 'Bloquea', description: 'Esta issue bloquea a otra issue'},
    {value: IssueLinkTypeEnum.BLOCKED_BY, label: 'Bloqueado por', description: 'Esta issue está bloqueada por otra issue'},
    {value: IssueLinkTypeEnum.RELATES_TO, label: 'Se relaciona con', description: 'Esta issue se relaciona con otra issue'},
    {value: IssueLinkTypeEnum.DUPLICATES, label: 'Duplica', description: 'Esta issue duplica a otra issue'},
    {value: IssueLinkTypeEnum.DUPLICATED_BY, label: 'Duplicado por', description: 'Esta issue es duplicada por otra issue'},
    {value: IssueLinkTypeEnum.DEPENDS_ON, label: 'Depende de', description: 'Esta issue depende de otra issue'},
    {value: IssueLinkTypeEnum.DEPENDENCY_OF, label: 'Es dependencia de', description: 'Esta issue es dependencia de otra issue'},
  ];

  // Form
  linkForm: FormGroup;

  constructor() {
    this.linkForm = this.fb.group({
      target_issue_id: ['', [Validators.required]],
      link_type: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    if (!this.issueId) {
      this.error.set('Issue ID is required');
      return;
    }
    if (!this.projectId) {
      this.error.set('Project ID is required');
      return;
    }
    this.loadLinks();
    this.loadProjectIssues();
  }

  loadProjectIssues() {
    this.loadingIssues.set(true);
    this.issueService.getIssues({
      project: this.projectId,
      page: 1,
      ordering: '-created_at',
    }).subscribe({
      next: (response: PaginatedIssueList) => {
        // Filtrar la issue actual para que no aparezca en la lista
        const issuesFiltered = response.results.filter((issue) => issue.id !== this.issueId);
        this.projectIssues.set(issuesFiltered);
        this.filteredIssues.set(issuesFiltered);
        this.loadingIssues.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las issues del proyecto');
        this.loadingIssues.set(false);
        console.error('Error loading project issues:', err);
      },
    });
  }

  onIssueSearch(searchTerm: string) {
    this.issueSearchTerm.set(searchTerm);
    if (!searchTerm.trim()) {
      this.filteredIssues.set(this.projectIssues());
      return;
    }

    const filtered = this.projectIssues().filter((issue) =>
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    this.filteredIssues.set(filtered);
  }

  loadLinks(page = 1) {
    this.loading.set(true);
    this.error.set(null);

    this.issueService.getIssueLinks(this.issueId, {
      page,
      ordering: '-created_at',
    }).subscribe({
      next: (response: PaginatedIssueLinkList) => {
        this.links.set(response.results);
        this.totalLinks.set(response.count);
        this.totalPages.set(Math.ceil(response.count / 10));
        this.currentPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los links de la issue');
        this.loading.set(false);
        console.error('Error loading issue links:', err);
      },
    });
  }

  onSubmitLink() {
    if (this.linkForm.valid && !this.submitting()) {
      this.submitting.set(true);
      const formData = this.linkForm.value;

      const linkRequest: IssueLinkRequest = {
        source_issue_id: this.issueId,
        target_issue_id: formData.target_issue_id,
        link_type: formData.link_type,
      };

      this.issueService.createIssueLink(this.issueId, linkRequest).subscribe({
        next: (newLink) => {
          this.links.update((links) => [newLink, ...links]);
          this.totalLinks.update((count) => count + 1);
          this.linkForm.reset();
          this.showCreateForm.set(false);
          this.submitting.set(false);
          // Limpiar búsqueda
          this.issueSearchTerm.set('');
          this.filteredIssues.set(this.projectIssues());
        },
        error: (err) => {
          this.error.set('Error al crear el link entre issues');
          this.submitting.set(false);
          console.error('Error creating issue link:', err);
        },
      });
    }
  }

  selectIssue(issue: Issue) {
    this.linkForm.patchValue({target_issue_id: issue.id});
    // Limpiar búsqueda después de seleccionar
    this.issueSearchTerm.set('');
    this.filteredIssues.set(this.projectIssues());
  }

  getSelectedIssueTitle(): string {
    const selectedId = this.linkForm.get('target_issue_id')?.value;
    if (!selectedId) return '';

    const selectedIssue = this.projectIssues().find((issue) => issue.id === selectedId);
    return selectedIssue ? selectedIssue.title : '';
  }

  clearSelectedIssue() {
    this.linkForm.patchValue({target_issue_id: ''});
  }

  onDeleteLink(linkId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar esta relación?')) {
      this.issueService.deleteIssueLink(this.issueId, linkId).subscribe({
        next: () => {
          this.links.update((links) => links.filter((l) => l.id !== linkId));
          this.totalLinks.update((count) => count - 1);
        },
        error: (err) => {
          this.error.set('Error al eliminar el link');
          console.error('Error deleting issue link:', err);
        },
      });
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadLinks(page);
    }
  }

  toggleCreateForm() {
    this.showCreateForm.update((show) => !show);
    if (!this.showCreateForm()) {
      this.linkForm.reset();
      this.issueSearchTerm.set('');
      this.filteredIssues.set(this.projectIssues());
    }
  }

  getLinkTypeLabel(linkType: string): string {
    const type = this.LINK_TYPES.find((t) => t.value === linkType);
    return type ? type.label : linkType;
  }

  getLinkTypeColor(linkType: string): string {
    switch (linkType) {
      case IssueLinkTypeEnum.BLOCKS:
      case IssueLinkTypeEnum.BLOCKED_BY:
        return 'bg-red-100 text-red-800 border-red-200';
      case IssueLinkTypeEnum.DEPENDS_ON:
      case IssueLinkTypeEnum.DEPENDENCY_OF:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case IssueLinkTypeEnum.DUPLICATES:
      case IssueLinkTypeEnum.DUPLICATED_BY:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case IssueLinkTypeEnum.RELATES_TO:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRelatedIssue(link: IssueLink): Issue {
    // Si la issue actual es la source, retornamos la target, y viceversa
    return link.source_issue.id === this.issueId ? link.target_issue : link.source_issue;
  }

  getRelationDirection(link: IssueLink): 'outward' | 'inward' {
    // Si la issue actual es la source, es una relación "outward", sino "inward"
    return link.source_issue.id === this.issueId ? 'outward' : 'inward';
  }

  // Métodos para el modal de detalle
  showLinkDetail(linkId: string) {
    this.selectedLinkId.set(linkId);
    this.showDetailModal.set(true);
  }

  closeLinkDetail() {
    this.showDetailModal.set(false);
    this.selectedLinkId.set(null);
  }
}
