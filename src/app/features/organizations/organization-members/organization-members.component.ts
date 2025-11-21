import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {OrganizationService} from '../../../core/services/organization.service';
import {OrganizationMember, OrganizationInvitation}
  from '../../../core/models/interfaces';
import {CommonModule} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {AuthStore} from '../../../core/store/auth.store';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [CommonModule, TableModule, ProgressSpinnerModule,
    ReactiveFormsModule],
  templateUrl: './organization-members.component.html',
  styleUrl: './organization-members.component.css',
})
export class OrganizationMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  organizationService = inject(OrganizationService);
  authStore = inject(AuthStore);
  resendInvitation(invitationId: string): void {
    this.invitationsLoading = true;
    this.organizationService.resendInvitation(this.organizationId,
        invitationId).subscribe({
      next: () => this.loadInvitations(),
      error: () => this.loadInvitations(),
    });
  }

  cancelInvitation(invitationId: string): void {
    this.invitationsLoading = true;
    this.organizationService.cancelInvitation(this.organizationId,
        invitationId).subscribe({
      next: () => this.loadInvitations(),
      error: () => this.loadInvitations(),
    });
  }

  organizationId = '';
  members: OrganizationMember[] = [];
  invitations: OrganizationInvitation[] = [];
  invitationsLoading = false;
  invitationsError = '';
  currentUserRole = '';
  currentUserEmail = '';

  loading = true;
  error = '';
  page = 1;
  total = 0;

  // Gestión de roles
  editRoleModalOpen = false;
  selectedMember: OrganizationMember | null = null;
  roleForm: FormGroup;
  roleLoading = false;
  roleError = '';
  roleSuccess = '';

  // Modal y formulario de invitación
  inviteModalOpen = false;
  inviteForm: FormGroup;
  inviteLoading = false;
  inviteError = '';
  inviteSuccess = '';

  constructor() {
    const fb = inject(FormBuilder);
    this.inviteForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['member', Validators.required],
    });
    this.roleForm = fb.group({
      role: ['', Validators.required],
    });
  }
  openEditRoleModal(member: OrganizationMember): void {
    this.selectedMember = member;
    this.roleForm.reset({role: member.role});
    this.roleError = '';
    this.roleSuccess = '';
    this.editRoleModalOpen = true;
  }

  closeEditRoleModal(): void {
    this.editRoleModalOpen = false;
    this.selectedMember = null;
    this.roleForm.reset();
    this.roleError = '';
    this.roleSuccess = '';
  }

  submitRoleChange(): void {
    if (!this.selectedMember || this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    this.roleLoading = true;
    this.roleError = '';
    this.roleSuccess = '';
    const newRole = this.roleForm.value.role;
    // PATCH /api/v1/orgs/members/{id}/update-role/
    this.organizationService.updateOrganizationMemberRoleById(
        this.selectedMember.id,
        {role: newRole},
    ).subscribe({
      next: () => {
        this.roleSuccess = 'Rol actualizado correctamente.';
        this.roleLoading = false;
        this.loadMembers();
        setTimeout(() => this.closeEditRoleModal(), 1200);
      },
      error: (err: any) => {
        this.roleError = err.message || 'Error al actualizar el rol';
        this.roleLoading = false;
      },
    });
  }

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.paramMap.get('id') || '';
    // Obtener el email del usuario actual desde el store
    const currentUser = this.authStore.user();
    this.currentUserEmail = currentUser?.email || '';
    this.loadMembers();
    this.loadInvitations();
  }

  openInviteModal(): void {
    this.inviteModalOpen = true;
    this.inviteForm.reset({role: 'member'});
    this.inviteError = '';
    this.inviteSuccess = '';
  }

  closeInviteModal(): void {
    this.inviteModalOpen = false;
    this.inviteForm.reset({role: 'member'});
    this.inviteError = '';
    this.inviteSuccess = '';
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.inviteLoading = true;
    this.inviteError = '';
    this.inviteSuccess = '';
    const data = {
      email: this.inviteForm.value.email,
      role: this.inviteForm.value.role,
    };
    this.organizationService.sendInvitation(this.organizationId,
        data).subscribe({
      next: () => {
        this.inviteSuccess = 'Invitación enviada correctamente.';
        this.inviteLoading = false;
        this.loadInvitations();
        setTimeout(() => this.closeInviteModal(), 1200);
      },
      error: (err) => {
        this.inviteError = err.message || 'Error al invitar miembro';
        this.inviteLoading = false;
      },
    });
  }

  loadInvitations(page = 1): void {
    this.invitationsLoading = true;
    this.invitationsError = '';
    this.organizationService.getInvitations(this.organizationId,
        {page}).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.invitations = res;
        } else if (res && Array.isArray(res.results)) {
          this.invitations = res.results;
        } else {
          this.invitations = [];
        }
        this.invitationsLoading = false;
      },
      error: (err) => {
        this.invitationsError = err.message || 'Error al cargar invitaciones';
        this.invitationsLoading = false;
      },
    });
  }

  loadMembers(page = 1): void {
    this.loading = true;
    this.error = '';
    this.organizationService.getOrganizationMembers(this.organizationId,
        {page}).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.members = res;
          this.total = res.length;
        } else if (res && Array.isArray(res.results)) {
          this.members = res.results;
          this.total = res.count || res.results.length;
        } else {
          this.members = [];
          this.total = 0;
        }
        // Obtener el rol del usuario actual
        const currentMember = this.members.find(
            (m) => m.user.email === this.currentUserEmail);
        this.currentUserRole = currentMember?.role || '';
        console.log('🔐 Usuario actual:', this.currentUserEmail,
            'Rol:', this.currentUserRole);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar miembros';
        this.loading = false;
      },
    });
  }

  get canEditRoles(): boolean {
    const canEdit = this.currentUserRole === 'admin' ||
    this.currentUserRole === 'owner';
    console.log('🔍 canEditRoles:', canEdit, 'currentUserRole:',
        this.currentUserRole);
    return canEdit;
  }
}
