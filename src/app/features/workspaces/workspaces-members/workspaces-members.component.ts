import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceService, WorkspaceMember, WorkspaceMembersResponse, Workspace } from '../../../core/services/workspace.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationMember } from '../../../core/models/interfaces';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule  } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-workspaces-members',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PaginatorModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    DialogModule,
    Select,
    ConfirmDialog,
    TooltipModule,
    Button
  ],
  providers: [ConfirmationService],
  templateUrl: './workspaces-members.component.html',
  styleUrl: './workspaces-members.component.css'
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
  
  // Buscar usuarios para agregar al workspace (filtrar miembros de la organización)
  searchUsers() {
    // Filtrar miembros que NO están en el workspace
    const currentMemberIds = this.members().map(m => m.user.id);
    let availableMembers = this.organizationMembers().filter(
      orgMember => !currentMemberIds.includes(orgMember.user.id)
    );

    if (!this.searchUserTerm.trim()) {
      this.filteredOrgMembers.set(availableMembers);
      return;
    }
    
    const searchLower = this.searchUserTerm.toLowerCase();
    const filtered = availableMembers.filter(orgMember => {
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
    return this.members().some(m => m.user.id === userId);
  }

  // Agregar usuario al workspace
  addUserToWorkspace(orgMember: OrganizationMember, selectedRole: string) {
    this.addingMember.set(true);
    this.addMemberError.set('');
    this.addMemberSuccess.set('');
    
    const data = {
      workspace: this.workspaceId(),
      user_id: orgMember.user.id,
      role: selectedRole,
      permissions: {},
      is_active: true
    };
    
    this.workspaceService.addWorkspaceMember(data).subscribe({
      next: () => {
        this.addMemberSuccess.set('Miembro agregado exitosamente');
        this.addingMember.set(false);
        setTimeout(() => {
          this.addMemberModalVisible = false;
          this.searchUserTerm = '';
          this.addMemberSuccess.set('');
          this.loadMembers();
        }, 1000);
      },
      error: (err) => {
        this.addMemberError.set(err.error?.message || 'Error al agregar miembro');
        this.addingMember.set(false);
      }
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

  // Búsqueda y filtros
  searchTerm = '';
  selectedRole = '';

  // Opciones de roles
  roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Miembro', value: 'member' },
    { label: 'Invitado', value: 'guest' }
  ];

  constructor(
    private workspaceService: WorkspaceService,
    private organizationService: OrganizationService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.workspaceId.set(params['id']);
      if (this.workspaceId()) {
        this.loadWorkspaceInfo();
        this.loadMembers();
      }
    });
  }

  loadWorkspaceInfo() {
    this.workspaceService.getWorkspace(this.workspaceId()).subscribe({
      next: (workspace: any) => {
        console.log('📦 Workspace cargado:', workspace);
        this.workspaceName.set(workspace.name);
        // Buscar organizationId en organization o en organization_details
        let organizationId = '';
        if (workspace.organization && workspace.organization.id) {
          organizationId = workspace.organization.id;
        } else if (workspace.organization_details && workspace.organization_details.id) {
          organizationId = workspace.organization_details.id;
        }
        if (organizationId) {
          console.log('🏢 Organization ID encontrado:', organizationId);
          this.loadOrganizationMembers(organizationId);
        } else {
          console.error('❌ No se encontró organization.id ni organization_details.id en el workspace:', workspace);
        }
      },
      error: (err) => {
        console.error('Error loading workspace info:', err);
      }
    });
  }

  loadOrganizationMembers(organizationId: string) {
    console.log('🔍 Cargando miembros de la organización:', organizationId);
    this.loadingOrgMembers.set(true);
    this.organizationService.getOrganizationMembers(organizationId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de miembros de organización:', response);
        const membersArray = Array.isArray(response) ? response : Array.isArray(response.results) ? response.results : [];
        console.log('👥 Miembros encontrados:', membersArray.length);
        this.organizationMembers.set(membersArray);
        this.filteredOrgMembers.set(membersArray);
        this.loadingOrgMembers.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading organization members:', err);
        this.loadingOrgMembers.set(false);
      }
    });
  }

  loadMembers() {
    this.loading.set(true);
    this.error.set('');
    this.workspaceService.getWorkspaceMembers(
      this.workspaceId(),
      this.currentPage(),
      this.searchTerm || undefined
    ).subscribe({
      next: (response: any) => {
        const membersArray = Array.isArray(response) ? response : Array.isArray(response.results) ? response.results : [];
        this.members.set(membersArray);
        this.totalRecords.set(Array.isArray(membersArray) ? membersArray.length : (response.count || 0));
        this.loading.set(false);
        // Actualizar el filtro de miembros disponibles después de cargar
        this.searchUsers();
      },
      error: (err) => {
        console.log('Error loading members:', err);
        this.members.set([]);
        this.error.set('Error loading members: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: any) {
    this.currentPage.set(event.page + 1);
    this.loadMembers();
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadMembers();
  }

  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'member': 'Miembro',
      'guest': 'Invitado',
      'owner': 'Propietario'
    };
    return roles[role] || role;
  }

  getRoleSeverity(role: string): string {
    const severities: { [key: string]: string } = {
      'owner': 'danger',
      'admin': 'warning',
      'member': 'success',
      'guest': 'info'
    };
    return severities[role] || 'info';
  }

  goBack() {
    this.router.navigate(['/workspaces', this.workspaceId()]);
  }

  addMember() {
    console.log('➕ Abriendo modal para agregar miembro');
    console.log('👥 Miembros de organización disponibles:', this.organizationMembers().length);
    this.addMemberModalVisible = true;
    this.searchUserTerm = '';
    this.addMemberError.set('');
    this.addMemberSuccess.set('');
    // Filtrar usuarios que ya son miembros
    this.searchUsers();
  }

  onRoleChange(member: WorkspaceMember, newRole: string) {
    const updateData = {
      role: newRole
    };
    
    this.workspaceService.updateWorkspaceMember(member.id, updateData).subscribe({
      next: (updatedMember) => {
        console.log('✅ Rol actualizado:', updatedMember);
        // Actualizar el miembro en la lista local
        const updatedMembers = this.members().map(m => 
          m.id === member.id ? updatedMember : m
        );
        this.members.set(updatedMembers);
      },
      error: (err) => {
        console.error('Error updating member role:', err);
        this.error.set('Error al actualizar el rol del miembro');
        // Revertir el cambio en el UI
        this.loadMembers();
      }
    });
  }

  removeMember(member: WorkspaceMember) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a ${member.user.full_name} del workspace?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.workspaceService.deleteWorkspaceMember(this.workspaceId(), member.id).subscribe({
          next: () => {
            console.log('✅ Miembro eliminado');
            // Remover el miembro de la lista local
            const updatedMembers = this.members().filter(m => m.id !== member.id);
            this.members.set(updatedMembers);
            this.totalRecords.set(this.totalRecords() - 1);
          },
          error: (err) => {
            console.error('Error removing member:', err);
            this.error.set('Error al eliminar el miembro');
          }
        });
      }
    });
  }
}
