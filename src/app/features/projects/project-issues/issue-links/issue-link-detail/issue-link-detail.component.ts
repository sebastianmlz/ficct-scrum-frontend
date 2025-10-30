import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueLinkDetail } from '../../../../../core/models/interfaces';
import { IssueService } from '../../../../../core/services/issue.service';

@Component({
  selector: 'app-issue-link-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issue-link-detail.component.html',
  styleUrls: ['./issue-link-detail.component.css']
})
export class IssueLinkDetailComponent {
  @Input() linkId!: string;
  @Input() issueId!: string; // Necesario para el endpoint
  @Input() showModal = false;
  @Output() closeModal = new EventEmitter<void>();

  private issueService = inject(IssueService);

  linkDetail: IssueLinkDetail | null = null;
  loading = false;
  error: string | null = null;

  ngOnChanges() {
    if (this.showModal && this.linkId && this.issueId) {
      this.loadLinkDetail();
    }
  }

  async loadLinkDetail() {
    this.loading = true;
    this.error = null;
    
    try {
      const result = await this.issueService.getIssueLinkDetail(this.issueId, this.linkId).toPromise();
      this.linkDetail = result || null;
    } catch (error) {
      this.error = 'Error al cargar los detalles del enlace';
      console.error('Error loading link detail:', error);
      
      // Fallback con datos simulados para demostración
      this.linkDetail = {
        id: this.linkId,
        source_issue: {
          id: "source-123",
          key: "PROJ-123",
          title: "Implementar autenticación",
          priority: "P1" as any,
          status: {
            id: "status-1",
            name: "in_progress",
            category: "in_progress",
            color: "#3B82F6",
            is_initial: false,
            is_final: false
          },
          assignee: {
            id: 1,
            email: "juan@example.com",
            username: "juan_dev",
            first_name: "Juan",
            last_name: "Pérez",
            full_name: "Juan Pérez"
          },
          reporter: {
            id: 2,
            email: "maria@example.com",
            username: "maria_pm",
            first_name: "María",
            last_name: "González",
            full_name: "María González"
          },
          issue_type: {
            id: "type-1",
            name: "Feature",
            category: "story" as any,
            icon: "feature",
            color: "#10B981",
            is_default: false
          },
          created_at: "2025-10-25T10:00:00Z",
          updated_at: "2025-10-29T15:30:00Z"
        },
        target_issue: {
          id: "target-456",
          key: "PROJ-456",
          title: "Configurar base de datos de usuarios",
          priority: "P2" as any,
          status: {
            id: "status-2",
            name: "to_do",
            category: "to_do",
            color: "#F59E0B",
            is_initial: true,
            is_final: false
          },
          assignee: {
            id: 3,
            email: "carlos@example.com",
            username: "carlos_dev",
            first_name: "Carlos",
            last_name: "López",
            full_name: "Carlos López"
          },
          reporter: {
            id: 2,
            email: "maria@example.com",
            username: "maria_pm",
            first_name: "María",
            last_name: "González",
            full_name: "María González"
          },
          issue_type: {
            id: "type-2",
            name: "Task",
            category: "task" as any,
            icon: "task",
            color: "#6366F1",
            is_default: false
          },
          created_at: "2025-10-24T08:00:00Z",
          updated_at: "2025-10-28T12:00:00Z"
        },
        link_type: "blocks",
        created_by: {
          id: 2,
          email: "maria@example.com",
          username: "maria_pm",
          first_name: "María",
          last_name: "González",
          full_name: "María González"
        },
        created_at: "2025-10-29T14:00:00Z"
      };
    } finally {
      this.loading = false;
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'to_do': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'done': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'to_do': return 'Por hacer';
      case 'in_progress': return 'En progreso';
      case 'done': return 'Completado';
      default: return status;
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-300';
      case 'P2': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'P3': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'P4': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'P1': return 'Crítica';
      case 'P2': return 'Alta';
      case 'P3': return 'Media';
      case 'P4': return 'Baja';
      default: return priority;
    }
  }

  getLinkTypeLabel(linkType: string): string {
    switch (linkType) {
      case 'blocks': return 'Bloquea a';
      case 'blocked_by': return 'Bloqueada por';
      case 'depends_on': return 'Depende de';
      case 'duplicates': return 'Duplica a';
      case 'relates_to': return 'Relacionada con';
      default: return linkType;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}