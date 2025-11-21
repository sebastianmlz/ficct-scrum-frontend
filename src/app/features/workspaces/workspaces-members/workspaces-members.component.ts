import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {WorkspacesService} from '../../../core/services/workspaces.service';
import {OrganizationService} from '../../../core/services/organization.service';
import {WorkspaceMember, Workspace, OrganizationMember, WorkspaceMemberRequest}
  from '../../../core/models/interfaces';

@Component({
  selector: 'app-workspaces-members',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './workspaces-members.component.html',
  styleUrl: './workspaces-members.component.css',
})
export class WorkspacesMembersComponent implements OnInit {
  // Estado para el modal de agregar miembro
  addMemberModalVisible = false;
  searchUserTerm = '';
  organizationMembers = signal<OrganizationMember[]>([]);
  filteredOrgMembers = signal<OrganizationMember[]>([]);
  loadingOrgMembers = signal(false);
  addingMember = signal(false);
  addMemberError = signal('');
  addMemberSuccess = signal('');

  // Estado para el modal de confirmación de eliminación
  showDeleteConfirm = signal(false);
  memberToDelete = signal<WorkspaceMember | null>(null);

  // Buscar usuarios para agregar al workspace
  searchUsers() {
    // Filtrar miembros que NO están en el workspace
    const currentMemberIds = this.members().map((m) => m.user.id);

    const availableMembers = this.organizationMembers().filter(
        (orgMember) => !currentMemberIds.includes(orgMember.user.id),
    );

    if (!this.searchUserTerm.trim()) {
      this.filteredOrgMembers.set(availableMembers);
      return;
    }

    const searchLower = this.searchUserTerm.toLowerCase();
    const filtered = availableMembers.filter((orgMember) => {
      const user = orgMember.user;
      return (
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower)
      );
    });

    this.filteredOrgMembers.set(filtered);
  }

  // Verificar si un usuario ya es miembro del workspace
  isAlreadyMember(userId: number): boolean {
    return this.members().some((m) => m.user.id === userId);
  }

  // Agregar usuario al workspace
  addUserToWorkspace(orgMember: OrganizationMember, selectedRole: string) {
    this.addingMember.set(true);
    this.addMemberError.set('');
    this.addMemberSuccess.set('');

    const data: WorkspaceMemberRequest = {
      workspace: this.workspaceId(),
      user_id: orgMember.user.id.toString(),
      role: selectedRole as any,
      permissions: {},
      is_active: true,
    };

    this.workspacesService.addWorkspaceMember(data).subscribe({
      next: () => {
        this.addMemberSuccess.set('Member added successfully');
        this.addingMember.set(false);
        setTimeout(() => {
          this.addMemberModalVisible = false;
          this.searchUserTerm = '';
          this.addMemberSuccess.set('');
          this.loadMembers();
        }, 1000);
      },
      error: (err: Error) => {
        this.addMemberError.set(err.message || 'Failed to add member');
        this.addingMember.set(false);
      },
    });
  }
  members = signal<WorkspaceMember[]>([]);
  loading = signal(false);
  error = signal('');
  workspaceId = signal('');
  workspaceName = signal('');

  // Paginación
  totalRecords = signal(0);
  currentPage = signal(1);
  rowsPerPage = 10;
  Math = Math; // Exponer Math para usarlo en el template

  // Búsqueda y filtros
  searchTerm = '';
  selectedRole = '';

  private workspacesService = inject(WorkspacesService);
  private organizationService = inject(OrganizationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.workspaceId.set(params['id']);
      if (this.workspaceId()) {
        this.loadWorkspaceInfo();
        this.loadMembers();
      }
    });
  }

  loadWorkspaceInfo() {
    this.workspacesService.getWorkspace(this.workspaceId()).subscribe({
      next: (workspace: Workspace) => {
        this.workspaceName.set(workspace.name);
        if (workspace.organization_details &&
          workspace.organization_details.id) {
          this.loadOrganizationMembers(workspace.organization_details.id);
        }
      },
      error: (err: Error) => {
        console.error('[WorkspaceMembers] Error loading workspace info:', err);
      },
    });
  }

  loadOrganizationMembers(organizationId: string) {
    this.loadingOrgMembers.set(true);
    this.organizationService.getOrganizationMembers(organizationId).subscribe({
      next: (response: any) => {
        const membersArray = Array.isArray(response) ? response :
        Array.isArray(response.results) ? response.results : [];
        this.organizationMembers.set(membersArray);
        this.loadingOrgMembers.set(false);
      },
      error: (err: Error) => {
        console.error('[WorkspaceMembers] Error loading organization members:',
            err);
        this.loadingOrgMembers.set(false);
      },
    });
  }

  loadMembers() {
    this.loading.set(true);
    this.error.set('');

    const params = {
      page: this.currentPage(),
      search: this.searchTerm || undefined,
    };

    this.workspacesService.getWorkspaceMembers(this.workspaceId(), params)
        .subscribe({
          next: (response) => {
            this.members.set(response.results || []);
            this.totalRecords.set(response.count);
            this.loading.set(false);
            this.searchUsers();
          },
          error: (err: Error) => {
            console.error('[WorkspaceMembers] Error loading members:', err);
            this.members.set([]);
            this.error.set(err.message || 'Failed to load members');
            this.loading.set(false);
          },
        });
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadMembers();
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadMembers();
    }
  }

  nextPage() {
    if (this.currentPage() < Math
        .ceil(this.totalRecords() / this.rowsPerPage)) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadMembers();
    }
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadMembers();
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      'admin': 'Administrador',
      'member': 'Miembro',
      'guest': 'Invitado',
      'owner': 'Propietario',
    };
    return roles[role] || role;
  }

  getRoleSeverity(role: string): string {
    const severities: Record<string, string> = {
      'owner': 'danger',
      'admin': 'warning',
      'member': 'success',
      'guest': 'info',
    };
    return severities[role] || 'info';
  }

  goBack() {
    this.router.navigate(['/workspaces', this.workspaceId()]);
  }

  addMember() {
    this.addMemberModalVisible = true;
    this.searchUserTerm = '';
    this.addMemberError.set('');
    this.addMemberSuccess.set('');
    // Filtrar usuarios que ya son miembros
    this.searchUsers();
  }

  onRoleChange(member: WorkspaceMember, newRole: string) {
    this.workspacesService.updateWorkspaceMemberRole(member.id, newRole)
        .subscribe({
          next: (updatedMember) => {
            const updatedMembers = this.members().map((m) =>
              m.id === member.id ? updatedMember : m,
            );
            this.members.set(updatedMembers);
          },
          error: (err: Error) => {
            console.error('[WorkspaceMembers] Error updating member role:',
                err);
            this.error.set(err.message || 'Failed to update member role');
            this.loadMembers();
          },
        });
  }

  removeMember(member: WorkspaceMember) {
    this.memberToDelete.set(member);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
    this.memberToDelete.set(null);
  }

  confirmDelete() {
    const member = this.memberToDelete();
    if (!member) return;

    this.workspacesService.removeWorkspaceMember(member.id).subscribe({
      next: () => {
        const updatedMembers = this.members().filter((m) => m.id !== member.id);
        this.members.set(updatedMembers);
        this.totalRecords.set(this.totalRecords() - 1);
        this.showDeleteConfirm.set(false);
        this.memberToDelete.set(null);
      },
      error: (err: Error) => {
        console.error('[WorkspaceMembers] Error removing member:', err);
        this.error.set(err.message || 'Failed to remove member');
        this.showDeleteConfirm.set(false);
        this.memberToDelete.set(null);
      },
    });
  }
}
