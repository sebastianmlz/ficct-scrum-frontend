import {Component, Input, Output, EventEmitter, OnInit, signal, inject}
  from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators}
  from '@angular/forms';
import {ProjectService} from '../../../../core/services/project.service';
import {WorkspaceService} from '../../../../core/services/workspace.service';
import {
  ProjectMember,
  ProjectMemberRoleEnum,
  WorkspaceMember,
} from '../../../../core/models/interfaces';

@Component({
  selector: 'app-project-members-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-members-modal.component.html',
})
export class ProjectMembersModalComponent implements OnInit {
  private projectService = inject(ProjectService);
  private workspaceService = inject(WorkspaceService);
  private fb = inject(FormBuilder);

  @Input() projectId!: string;
  @Input() workspaceId!: string;
  @Output() closed = new EventEmitter<void>();

  members = signal<ProjectMember[]>([]);
  workspaceMembers = signal<WorkspaceMember[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Add member modal states
  showAddMember = signal(false);
  addMemberLoading = signal(false);
  addMemberError = signal<string | null>(null);
  addMemberForm: FormGroup;

  // Edit role modal states
  showEditRole = signal(false);
  selectedMember = signal<ProjectMember | null>(null);
  editRoleLoading = signal(false);
  editRoleError = signal<string | null>(null);
  editRoleForm: FormGroup;

  // Role options
  roles = [
    {value: ProjectMemberRoleEnum.ADMIN, label: 'Admin',
      description: 'Can manage project and members'},
    {value: ProjectMemberRoleEnum.MEMBER, label: 'Member',
      description: 'Can view and edit project content'},
    {value: ProjectMemberRoleEnum.VIEWER, label: 'Viewer',
      description: 'Can only view project content'},
  ];

  constructor() {
    this.addMemberForm = this.fb.group({
      user_id: ['', Validators.required],
      role: [ProjectMemberRoleEnum.MEMBER, Validators.required],
    });

    this.editRoleForm = this.fb.group({
      role: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadMembers();
    this.loadWorkspaceMembers();
  }

  loadMembers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.projectService.getProjectMembers(this.projectId).subscribe({
      next: (response) => {
        this.members.set(response.results || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load project members');
        this.loading.set(false);
        console.error('[PROJECT MEMBERS] Error loading members:', err);
      },
    });
  }

  loadWorkspaceMembers(): void {
    this.workspaceService.getWorkspaceMembers(this.workspaceId).subscribe({
      next: (response) => {
        this.workspaceMembers.set((response.results || []) as any);
      },
      error: (err) => {
        console.error('[PROJECT MEMBERS] Error loading workspace members:',
            err);
      },
    });
  }

  // Get available workspace members (not already in project)
  get availableWorkspaceMembers(): WorkspaceMember[] {
    const projectMemberIds = this.members().map((m) =>
      m.user.user_uuid || m.user.id.toString());
    return this.workspaceMembers().filter((wm) =>
      !projectMemberIds.includes(wm.user.user_uuid || wm.user.id.toString()),
    );
  }

  openAddMemberModal(): void {
    this.showAddMember.set(true);
    this.addMemberForm.reset({role: ProjectMemberRoleEnum.MEMBER});
    this.addMemberError.set(null);
  }

  closeAddMemberModal(): void {
    this.showAddMember.set(false);
    this.addMemberForm.reset();
    this.addMemberError.set(null);
  }

  submitAddMember(): void {
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    this.addMemberLoading.set(true);
    this.addMemberError.set(null);

    const formValue = this.addMemberForm.value;
    const memberData = {
      project: this.projectId,
      user_id: formValue.user_id,
      role: formValue.role,
    };

    this.projectService.addProjectMember(this.projectId, memberData).subscribe({
      next: () => {
        this.addMemberLoading.set(false);
        this.closeAddMemberModal();
        this.loadMembers();
      },
      error: (err) => {
        this.addMemberError.set(err.error?.message || 'Failed to add member');
        this.addMemberLoading.set(false);
        console.error('[PROJECT MEMBERS] Error adding member:', err);
      },
    });
  }

  openEditRoleModal(member: ProjectMember): void {
    this.selectedMember.set(member);
    this.editRoleForm.patchValue({role: member.role});
    this.showEditRole.set(true);
    this.editRoleError.set(null);
  }

  closeEditRoleModal(): void {
    this.showEditRole.set(false);
    this.selectedMember.set(null);
    this.editRoleForm.reset();
    this.editRoleError.set(null);
  }

  submitEditRole(): void {
    const member = this.selectedMember();
    if (!member || this.editRoleForm.invalid) {
      this.editRoleForm.markAllAsTouched();
      return;
    }

    this.editRoleLoading.set(true);
    this.editRoleError.set(null);

    const newRole = this.editRoleForm.value.role;

    this.projectService.updateProjectMember(this.projectId, member.id,
        {role: newRole}).subscribe({
      next: () => {
        this.editRoleLoading.set(false);
        this.closeEditRoleModal();
        this.loadMembers();
      },
      error: (err) => {
        this.editRoleError.set(err.error?.message || 'Failed to update role');
        this.editRoleLoading.set(false);
        console.error('[PROJECT MEMBERS] Error updating role:', err);
      },
    });
  }

  removeMember(member: ProjectMember): void {
    if (!confirm(`Remove ${member.user.full_name} from this project?`)) {
      return;
    }

    this.projectService.removeProjectMember(this.projectId,
        member.id).subscribe({
      next: () => {
        this.loadMembers();
      },
      error: (err) => {
        alert('Failed to remove member: ' + (err.error?.message ||
          'Unknown error'));
        console.error('[PROJECT MEMBERS] Error removing member:', err);
      },
    });
  }

  getRoleBadgeClass(role: ProjectMemberRoleEnum): string {
    switch (role) {
      case ProjectMemberRoleEnum.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case ProjectMemberRoleEnum.MEMBER:
        return 'bg-blue-100 text-blue-800';
      case ProjectMemberRoleEnum.VIEWER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleLabel(role: ProjectMemberRoleEnum): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  getInitials(fullName: string): string {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  getAvatarColor(fullName: string): string {
    if (!fullName) return 'bg-gray-400 text-white';

    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      'bg-blue-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-teal-500 text-white',
      'bg-cyan-500 text-white',
      'bg-emerald-500 text-white',
      'bg-amber-500 text-white',
    ];

    return colors[Math.abs(hash) % colors.length];
  }

  close(): void {
    this.closed.emit();
  }
}
