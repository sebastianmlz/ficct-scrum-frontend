import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization, OrganizationMember, OrganizationMemberRequest, PaginatedOrganizationMemberList, PaginationParams } from '../../../core/models/interfaces';
import { OrganizationMemberRoleEnum } from '../../../core/models/enums';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './organization-members.component.html'
})
export class OrganizationMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);
  private fb = inject(FormBuilder);

  organizationId: string = '';
  organization = signal<Organization | null>(null);
  members = signal<OrganizationMember[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  paginationData = signal<PaginatedOrganizationMemberList | null>(null);
  currentPage = signal(1);
  showInviteForm = false;

  inviting = signal(false);
  inviteError = signal<string | null>(null);
  inviteSuccess = signal<string | null>(null);

  Math = Math;

  roles = [
    { value: OrganizationMemberRoleEnum.OWNER, label: 'Owner' },
    { value: OrganizationMemberRoleEnum.ADMIN, label: 'Admin' },
    { value: OrganizationMemberRoleEnum.MANAGER, label: 'Manager' },
    { value: OrganizationMemberRoleEnum.MEMBER, label: 'Member' },
    { value: OrganizationMemberRoleEnum.GUEST, label: 'Guest' }
  ];

  searchForm: FormGroup = this.fb.group({
    search: [''],
    role: ['']
  });

  inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role: [OrganizationMemberRoleEnum.MEMBER, [Validators.required]]
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.organizationId = params['id'];
      if (this.organizationId) {
        this.loadOrganization();
        this.loadMembers();
      }
    });
  }

  async loadOrganization(): Promise<void> {
    try {
      const org = await this.organizationService.getOrganization(this.organizationId).toPromise();
      if (org) {
        this.organization.set(org);
      }
    } catch (error: any) {
      console.error('Failed to load organization:', error);
    }
  }

  async loadMembers(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.organizationService.getOrganizationMembers(this.organizationId, params).toPromise();
      if (response) {
        this.members.set(response.results);
        this.paginationData.set(response);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load members');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    const searchParams: PaginationParams = {
      page: 1,
      search: this.searchForm.value.search || undefined,
      role: this.searchForm.value.role || undefined
    };
    
    this.currentPage.set(1);
    this.loadMembers(searchParams);
  }

  loadPage(page: number): void {
    if (page < 1) return;
    
    const searchParams: PaginationParams = {
      page,
      search: this.searchForm.value.search || undefined,
      role: this.searchForm.value.role || undefined
    };
    
    this.currentPage.set(page);
    this.loadMembers(searchParams);
  }

  async onInvite(): Promise<void> {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviting.set(true);
    this.inviteError.set(null);
    this.inviteSuccess.set(null);

    try {
      const memberData: OrganizationMemberRequest = {
        email: this.inviteForm.value.email,
        role: this.inviteForm.value.role
      };

      await this.organizationService.addOrganizationMember(this.organizationId, memberData).toPromise();
      this.inviteSuccess.set('Invitation sent successfully!');
      this.inviteForm.reset({ role: OrganizationMemberRoleEnum.MEMBER });
      this.loadMembers(); // Reload to show new member
      
      // Clear success message after 3 seconds
      setTimeout(() => this.inviteSuccess.set(null), 3000);
    } catch (error: any) {
      this.inviteError.set(error.error?.message || 'Failed to send invitation');
    } finally {
      this.inviting.set(false);
    }
  }

  editMember(member: OrganizationMember): void {
    // TODO: Implement edit member functionality
    console.log('Edit member:', member);
  }

  async removeMember(member: OrganizationMember): Promise<void> {
    if (!confirm(`Are you sure you want to remove ${member.user.full_name} from this organization?`)) {
      return;
    }

    try {
      await this.organizationService.removeOrganizationMember(this.organizationId, member.id).toPromise();
      this.loadMembers(); // Reload to reflect changes
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to remove member');
    }
  }

  getInitials(fullName: string): string {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLabel(role: OrganizationMemberRoleEnum): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getRoleBadgeClass(role: OrganizationMemberRoleEnum): string {
    switch (role) {
      case OrganizationMemberRoleEnum.OWNER:
        return 'bg-purple-100 text-purple-800';
      case OrganizationMemberRoleEnum.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case OrganizationMemberRoleEnum.MANAGER:
        return 'bg-indigo-100 text-indigo-800';
      case OrganizationMemberRoleEnum.MEMBER:
        return 'bg-green-100 text-green-800';
      case OrganizationMemberRoleEnum.GUEST:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
