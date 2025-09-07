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
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <a [routerLink]="['/organizations', organizationId]" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </a>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Organization Members</h1>
                @if (organization()) {
                  <p class="text-sm text-gray-500">{{ organization()!.name }}</p>
                }
              </div>
            </div>
            <button
              (click)="showInviteForm = !showInviteForm"
              class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 font-medium"
            >
              Invite Member
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Invite Form -->
          @if (showInviteForm) {
            <div class="bg-white p-6 rounded-lg shadow mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Invite New Member</h3>
              
              @if (inviteError()) {
                <div class="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800">Error sending invitation</h3>
                      <p class="mt-1 text-sm text-red-700">{{ inviteError() }}</p>
                    </div>
                  </div>
                </div>
              }

              @if (inviteSuccess()) {
                <div class="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div class="flex">
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-green-800">Success</h3>
                      <p class="mt-1 text-sm text-green-700">{{ inviteSuccess() }}</p>
                    </div>
                  </div>
                </div>
              }

              <form [formGroup]="inviteForm" (ngSubmit)="onInvite()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="member@example.com"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    [class.border-red-300]="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched"
                  />
                  @if (inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched) {
                    <p class="mt-1 text-sm text-red-600">Valid email address is required</p>
                  }
                </div>

                <div>
                  <label for="role" class="block text-sm font-medium text-gray-700">
                    Role *
                  </label>
                  <select
                    id="role"
                    formControlName="role"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    @for (role of roles; track role.value) {
                      <option [value]="role.value">{{ role.label }}</option>
                    }
                  </select>
                </div>

                <div class="flex items-end">
                  <button
                    type="submit"
                    [disabled]="inviteForm.invalid || inviting()"
                    class="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @if (inviting()) {
                      <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Inviting...
                      </div>
                    } @else {
                      Send Invitation
                    }
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- Search and Filter -->
          <div class="bg-white p-6 rounded-lg shadow mb-6">
            <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="flex gap-4 items-end">
              <div class="flex-1">
                <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
                  Search Members
                </label>
                <input
                  id="search"
                  type="text"
                  formControlName="search"
                  placeholder="Search by name or email..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label for="roleFilter" class="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <select
                  id="roleFilter"
                  formControlName="role"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  (change)="onSearch()"
                >
                  <option value="">All Roles</option>
                  @for (role of roles; track role.value) {
                    <option [value]="role.value">{{ role.label }}</option>
                  }
                </select>
              </div>
              <button
                type="submit"
                class="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 font-medium"
              >
                Search
              </button>
            </form>
          </div>

          <!-- Loading State -->
          @if (loading()) {
            <div class="flex justify-center items-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }

          <!-- Error State -->
          @if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div class="flex">
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error loading members</h3>
                  <p class="mt-1 text-sm text-red-700">{{ error() }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Members Table -->
          @if (members().length > 0) {
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (member of members(); track member.id) {
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            @if (member.user.avatar_url) {
                              <img [src]="member.user.avatar_url" [alt]="member.user.full_name" class="h-10 w-10 rounded-full">
                            } @else {
                              <div class="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                <span class="text-sm font-medium text-white">
                                  {{ getInitials(member.user.full_name) }}
                                </span>
                              </div>
                            }
                            <div class="ml-4">
                              <div class="text-sm font-medium text-gray-900">{{ member.user.full_name }}</div>
                              <div class="text-sm text-gray-500">{{ member.user.email }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span [class]="getRoleBadgeClass(member.role)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                            {{ getRoleLabel(member.role) }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span [class]="getStatusBadgeClass(member.is_active)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                            {{ member.is_active ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ member.joined_at | date:'mediumDate' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div class="flex justify-end space-x-2">
                            <button
                              (click)="editMember(member)"
                              class="text-primary hover:text-primary/80"
                            >
                              Edit
                            </button>
                            <button
                              (click)="removeMember(member)"
                              class="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination -->
              @if (paginationData() && (paginationData()!.count > members().length)) {
                <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <p class="text-sm text-gray-700">
                        Showing {{ ((currentPage() - 1) * 20) + 1 }} to {{ Math.min(currentPage() * 20, paginationData()!.count) }} of {{ paginationData()!.count }} results
                      </p>
                    </div>
                    <div class="flex space-x-2">
                      <button
                        (click)="loadPage(currentPage() - 1)"
                        [disabled]="!paginationData()?.previous"
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        (click)="loadPage(currentPage() + 1)"
                        [disabled]="!paginationData()?.next"
                        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else if (!loading()) {
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by inviting your first member.</p>
              <div class="mt-6">
                <button
                  (click)="showInviteForm = true"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  Invite Member
                </button>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
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
