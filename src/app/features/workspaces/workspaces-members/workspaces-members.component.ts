import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceService, WorkspaceMember, WorkspaceMembersResponse } from '../../../core/services/workspace.service';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

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
    TagModule
  ],
  templateUrl: './workspaces-members.component.html',
  styleUrl: './workspaces-members.component.css'
})
export class WorkspacesMembersComponent implements OnInit {
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
  
  constructor(
    private workspaceService: WorkspaceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
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
        this.workspaceName.set(workspace.name);
      },
      error: (err) => {
        console.error('Error loading workspace info:', err);
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
      next: (response: WorkspaceMembersResponse) => {
        this.members.set(response.results);
        this.totalRecords.set(response.count);
        this.loading.set(false);
      },
      error: (err) => {
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
    // TODO: Implementar modal o página para agregar miembros
    console.log('Add member functionality');
  }
  
  editMember(member: WorkspaceMember) {
    // TODO: Implementar edición de miembro
    console.log('Edit member:', member);
  }
  
  removeMember(member: WorkspaceMember) {
    // TODO: Implementar eliminación de miembro
    console.log('Remove member:', member);
  }
}
