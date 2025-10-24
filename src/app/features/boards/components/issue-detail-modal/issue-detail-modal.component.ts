import { Component, inject, OnInit, signal, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Issue, IssueType, IssueStatus, WorkspaceMember } from '../../../../core/models/interfaces';
import { IssueService } from '../../../../core/services/issue.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { getAllPriorities, PriorityConfig, getPriorityTailwindClasses } from '../../../../shared/utils/priority.utils';

@Component({
  selector: 'app-issue-detail-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './issue-detail-modal.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 0;
    }

    /* Mobile: Full screen modal */
    @media (max-width: 768px) {
      .modal-content {
        background: white;
        border-radius: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow-y: auto;
        box-shadow: none;
      }

      .modal-header {
        position: sticky;
        top: 0;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 16px;
        z-index: 10;
      }

      .modal-body {
        padding: 16px;
      }
    }

    /* Tablet and Desktop: Centered modal with max-width */
    @media (min-width: 769px) {
      .modal-overlay {
        padding: 20px;
      }

      .modal-content {
        background: white;
        border-radius: 12px;
        width: 100%;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .modal-header {
        position: sticky;
        top: 0;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 20px 24px;
        z-index: 10;
      }

      .modal-body {
        padding: 24px;
      }
    }

    .modal-footer {
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid #e5e7eb;
      padding: 16px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      z-index: 10;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 6px;
    }

    input, select, textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.15s;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea {
      min-height: 100px;
      resize: vertical;
      font-family: inherit;
    }

    .title-input {
      font-size: 20px;
      font-weight: 600;
      border: 2px solid transparent;
      padding: 8px 12px;
    }

    .title-input:focus {
      border-color: #3b82f6;
    }

    button {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.025em;
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class IssueDetailModalComponent implements OnInit {
  @Input() issueId!: string;
  @Input() projectId!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() issueUpdated = new EventEmitter<Issue>();
  @Output() issueDeleted = new EventEmitter<string>();

  private issueService = inject(IssueService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  issue = signal<Issue | null>(null);
  issueTypes = signal<IssueType[]>([]);
  workspaceMembers = signal<WorkspaceMember[]>([]);
  workflowStatuses = signal<IssueStatus[]>([]);
  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);
  
  private http = inject(HttpClient);

  issueForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(500)]],
    description: [''],
    issue_type: [''],
    priority: ['P3'],
    assignee: [null],
    status: [null],
    story_points: [null],
    estimated_hours: [null]
  });

  // Priorities from utility functions
  priorities: { value: string; label: string }[] = getAllPriorities().map(p => ({
    value: p.code,
    label: p.label
  }));

  ngOnInit(): void {
    console.log('[ISSUE DETAIL] Modal initialized for issue:', this.issueId);
    this.loadIssue();
    this.loadIssueTypes();
    this.loadWorkspaceMembers();
    this.loadWorkflowStatuses();
  }

  async loadIssue(): Promise<void> {
    this.loading.set(true);
    try {
      console.log('[ISSUE DETAIL] Loading issue:', this.issueId);
      const issue = await this.issueService.getIssue(this.issueId).toPromise();
      
      if (issue) {
        console.log('[ISSUE DETAIL] ✅ Issue loaded:', issue);
        this.issue.set(issue);
        
        // Populate form
        // ⚠️ TEMPORAL: Usar user_uuid si existe, sino user.id como fallback
        // TODO: Backend debe agregar user_uuid al serializer UserBasic
        const assigneeValue = issue.assignee?.user_uuid || issue.assignee?.id || null;
        console.log('[ISSUE DETAIL] Initializing form - assignee:', {
          user_uuid: issue.assignee?.user_uuid,
          user_id: issue.assignee?.id,
          selected: assigneeValue,
          using_uuid: !!issue.assignee?.user_uuid,
          using_id_fallback: !issue.assignee?.user_uuid && !!issue.assignee?.id
        });
        
        if (issue.assignee && !issue.assignee.user_uuid) {
          console.warn('[ISSUE DETAIL] ⚠️ Backend did NOT provide user_uuid, using integer ID as fallback');
          console.warn('[ISSUE DETAIL] This may cause "Assignee is not a member" error');
          console.warn('[ISSUE DETAIL] Backend should add user_uuid to UserBasic serializer');
        }
        
        this.issueForm.patchValue({
          title: issue.title,
          description: issue.description || '',
          issue_type: issue.issue_type?.id || '',
          priority: issue.priority || 'P3',
          assignee: assigneeValue,
          status: issue.status?.id || null,
          story_points: issue.story_points,
          estimated_hours: issue.estimated_hours
        });
      }
    } catch (error) {
      console.error('[ISSUE DETAIL] ❌ Error loading issue:', error);
      this.notificationService.error('Failed to load issue details');
    } finally {
      this.loading.set(false);
    }
  }

  async loadIssueTypes(): Promise<void> {
    try {
      console.log('[ISSUE DETAIL] Loading issue types for project:', this.projectId);
      const response = await this.issueService.getIssueTypes(this.projectId).toPromise();
      
      if (response) {
        console.log('[ISSUE DETAIL] ✅ Issue types loaded:', response.results.length);
        this.issueTypes.set(response.results);
      }
    } catch (error) {
      console.error('[ISSUE DETAIL] ❌ Error loading issue types:', error);
    }
  }

  /**
   * Sanitize null-like values to actual null
   * Prevents sending "null" strings or "None" to backend
   */
  private cleanNullValue(value: any): any {
    if (value === "null" || value === "None" || value === "" || value === "undefined") {
      return null;
    }
    return value;
  }

  async onSave(): Promise<void> {
    console.log('[MODAL SAVE] === INICIO GUARDADO ===');
    
    if (this.issueForm.invalid) {
      console.error('[MODAL SAVE] Form invalid:', this.issueForm.errors);
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.issueForm.value;
      console.log('[MODAL SAVE] Form values:', formValue);
      
      // Build payload with clean null values
      const updateData: any = {
        title: formValue.title,
        description: formValue.description || '',
        issue_type: formValue.issue_type,
        priority: formValue.priority,
        story_points: this.cleanNullValue(formValue.story_points),
        estimated_hours: formValue.estimated_hours,
        status: this.cleanNullValue(formValue.status)
      };

      // CRITICAL: Always include assignee field, even if null
      // Backend requires this field to be present to unassign or assign
      updateData.assignee = this.cleanNullValue(formValue.assignee);
      
      console.log('[SAVE] ⚠️ BEFORE FILTER - assignee in updateData:', updateData.assignee);
      console.log('[SAVE] ⚠️ BEFORE FILTER - assignee type:', typeof updateData.assignee);
      console.log('[SAVE] ⚠️ BEFORE FILTER - assignee is undefined?:', updateData.assignee === undefined);
      console.log('[SAVE] ⚠️ BEFORE FILTER - full updateData:', updateData);

      // Remove undefined fields BUT ensure assignee is preserved
      const cleanPayload = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          // CRITICAL: Always keep assignee field, even if null
          if (key === 'assignee') {
            return true;  // Force inclusion
          }
          return value !== undefined;
        })
      );

      // EXHAUSTIVE LOGGING
      console.log('[SAVE] ========== PAYLOAD VALIDATION ==========')
      console.log('[SAVE] Form values:', formValue);
      console.log('[SAVE] Clean payload:', cleanPayload);
      
      // CRITICAL: Verify assignee field
      console.log('[SAVE] assignee - type:', typeof cleanPayload['assignee'], 'value:', cleanPayload['assignee']);
      console.log('[SAVE] assignee is UUID string?:', typeof cleanPayload['assignee'] === 'string' && cleanPayload['assignee']?.length > 30);
      console.log('[SAVE] assignee is integer ID (fallback)?:', typeof cleanPayload['assignee'] === 'number');
      console.log('[SAVE] assignee is null?:', cleanPayload['assignee'] === null);
      console.log('[SAVE] assignee is valid (UUID/ID or null)?:', 
        typeof cleanPayload['assignee'] === 'string' || 
        typeof cleanPayload['assignee'] === 'number' || 
        cleanPayload['assignee'] === null);
      
      console.log('[SAVE] status - type:', typeof cleanPayload['status'], 'value:', cleanPayload['status']);
      console.log('[SAVE] Payload JSON:', JSON.stringify(cleanPayload, null, 2));
      
      // CRITICAL: Verify assignee is in payload
      console.log('[SAVE] 🔍 ASSIGNEE FIELD CHECK:');
      console.log('[SAVE]    - Field exists in payload?:', 'assignee' in cleanPayload);
      console.log('[SAVE]    - Field value:', cleanPayload['assignee']);
      console.log('[SAVE]    - Field is null?:', cleanPayload['assignee'] === null);
      console.log('[SAVE]    - Field is undefined?:', cleanPayload['assignee'] === undefined);
      console.log('[SAVE]    - Field type:', typeof cleanPayload['assignee']);
      console.log('[SAVE]    - Is valid integer ID or null?:', typeof cleanPayload['assignee'] === 'number' || cleanPayload['assignee'] === null);
      
      // CRITICAL: Warn about assignee state
      if (cleanPayload['assignee'] === undefined) {
        console.error('[SAVE] ❌ CRITICAL ERROR: assignee is UNDEFINED!');
        console.error('[SAVE] This means the form field is not properly initialized.');
        console.error('[SAVE] Available members:', this.workspaceMembers());
      } else if (typeof cleanPayload['assignee'] === 'number') {
        console.warn('[SAVE] ⚠️ WARNING: Using integer ID as assignee (fallback)');
        console.warn('[SAVE] Backend expects UUID but user_uuid not provided by API');
        console.warn('[SAVE] This will likely cause "Assignee is not a member" error');
        console.warn('[SAVE] SOLUTION: Backend must add user_uuid to UserBasic serializer');
      }
      
      // CRITICAL: Log all payload keys to confirm assignee is present
      console.log('[SAVE] 📋 All payload keys:', Object.keys(cleanPayload));
      console.log('[SAVE] 📋 Payload includes assignee?:', Object.keys(cleanPayload).includes('assignee'));
      console.log('[SAVE] ==========================================');

      // ✅ BACKEND CORREGIDO: PATCH ahora retorna response completo con todas las relaciones expandidas
      const updatedIssue = await this.issueService.editIssue(this.issueId, cleanPayload).toPromise();
      console.log('[MODAL SAVE] ✅ PATCH response (COMPLETO):', updatedIssue);
      
      if (updatedIssue) {
        console.log('[MODAL SAVE] Response tiene assignee?:', !!updatedIssue.assignee);
        console.log('[MODAL SAVE] Response assignee value:', updatedIssue.assignee);
        console.log('[MODAL SAVE] Response tiene status?:', !!updatedIssue.status);
        console.log('[MODAL SAVE] Response status value:', updatedIssue.status);
        console.log('[MODAL SAVE] ✅ Issue actualizado con relaciones expandidas');
        console.log('[MODAL SAVE]    - Assignee completo:', JSON.stringify(updatedIssue.assignee));
        console.log('[MODAL SAVE]    - Status completo:', JSON.stringify(updatedIssue.status));
        console.log('[MODAL SAVE]    - Issue Type completo:', JSON.stringify(updatedIssue.issue_type));
        
        this.issue.set(updatedIssue);
        this.notificationService.success('Issue updated successfully');
        
        console.log('[MODAL SAVE] Emitiendo issueUpdated event con:', updatedIssue);
        console.log('[MODAL SAVE] Event payload - ID:', updatedIssue.id, 'Assignee:', updatedIssue.assignee);
        this.issueUpdated.emit(updatedIssue);
        
        // Reset form pristine state
        this.issueForm.markAsPristine();
        console.log('[MODAL SAVE] === FIN GUARDADO EXITOSO ===');
      } else {
        console.error('[MODAL SAVE] ❌ Response is null/undefined!');
      }
    } catch (error: any) {
      console.error('[MODAL SAVE] ❌ PATCH failed:', error);
      console.error('[MODAL SAVE] Error status:', error.status);
      console.error('[MODAL SAVE] Error body:', error.error);
      console.error('[MODAL SAVE] === FIN GUARDADO CON ERROR ===');
      const errorMessage = error.error?.detail || error.error?.message || 'Failed to save changes';
      this.notificationService.error(errorMessage);
    } finally {
      this.saving.set(false);
    }
  }

  async onDelete(): Promise<void> {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    this.deleting.set(true);

    try {
      console.log('[ISSUE DETAIL] Deleting issue:', this.issueId);
      await this.issueService.deleteIssue(this.issueId).toPromise();
      
      console.log('[ISSUE DETAIL] ✅ Issue deleted successfully');
      this.notificationService.success('Issue deleted successfully');
      this.issueDeleted.emit(this.issueId);
      this.onClose();
    } catch (error: any) {
      console.error('[ISSUE DETAIL] ❌ Error deleting issue:', error);
      const errorMessage = error.error?.detail || error.error?.message || 'Failed to delete issue';
      this.notificationService.error(errorMessage);
    } finally {
      this.deleting.set(false);
    }
  }

  onClose(): void {
    console.log('[MODAL] === CERRANDO MODAL ===');
    console.log('[MODAL] Issue actual:', this.issue());
    console.log('[MODAL] Form pristine:', this.issueForm.pristine);
    this.closed.emit();
    console.log('[MODAL] Evento closed emitido');
  }

  onOverlayClick(event: MouseEvent): void {
    // Close only if clicking the overlay, not the modal content
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  /**
   * Handle Escape key to close modal
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    console.log('[ISSUE DETAIL] Escape key pressed - closing modal');
    this.onClose();
  }

  async loadWorkspaceMembers(): Promise<void> {
    try {
      // First, get the complete project to obtain workspace ID
      console.log('[ISSUE DETAIL] Fetching project details for workspace:', this.projectId);
      
      const project = await this.http.get<any>(
        `${environment.apiUrl}/api/v1/projects/projects/${this.projectId}/`
      ).toPromise();
      
      if (!project?.workspace) {
        console.error('[ISSUE DETAIL] No workspace found in project');
        return;
      }
      
      const workspaceId = project.workspace;
      console.log('[ISSUE DETAIL] Loading workspace members for:', workspaceId);
      
      const response = await this.http.get<any>(
        `${environment.apiUrl}/api/v1/workspaces/members/?workspace=${workspaceId}`
      ).toPromise();
      
      if (response) {
        console.log('[ISSUE DETAIL] ✅ Workspace members loaded:', response.results.length);
        console.log('[ISSUE DETAIL] Sample member user data:', response.results[0]?.user);
        console.log('[ISSUE DETAIL] FULL member data:', JSON.stringify(response.results[0], null, 2));
        
        // Check if backend provides user_uuid
        const hasUserUuid = response.results.some((m: any) => m.user.user_uuid !== undefined);
        console.log('[ISSUE DETAIL] ⚠️ Backend provides user_uuid?:', hasUserUuid);
        
        console.log('[ISSUE DETAIL] Member mapping:', response.results.map((m: any) => ({
          user_id: m.user.id,
          user_uuid: m.user.user_uuid,
          has_uuid: !!m.user.user_uuid,
          user_email: m.user.email,
          name: m.user.full_name,
          will_use: m.user.user_uuid || m.user.id  // What dropdown will use
        })));
        
        if (!hasUserUuid) {
          console.warn('[ISSUE DETAIL] ⚠️⚠️⚠️ BACKEND CONFIGURATION ISSUE ⚠️⚠️⚠️');
          console.warn('[ISSUE DETAIL] Backend is NOT returning user_uuid in UserBasic serializer');
          console.warn('[ISSUE DETAIL] Frontend will use integer ID as fallback');
          console.warn('[ISSUE DETAIL] This may cause "Assignee is not a member" error on save');
          console.warn('[ISSUE DETAIL] SOLUTION: Backend must add user_uuid field to UserBasic serializer');
        }
        
        this.workspaceMembers.set(response.results || []);
      }
    } catch (error) {
      console.error('[ISSUE DETAIL] ❌ Error loading workspace members:', error);
    }
  }
  
  async loadWorkflowStatuses(): Promise<void> {
    try {
      console.log('[ISSUE DETAIL] Loading workflow statuses for project:', this.projectId);
      
      const response = await this.http.get<any>(
        `${environment.apiUrl}/api/v1/projects/workflow-statuses/?project=${this.projectId}`
      ).toPromise();
      
      if (response) {
        console.log('[ISSUE DETAIL] ✅ Workflow statuses loaded:', response.results.length);
        console.log('[ISSUE DETAIL] Workflow statuses data:', response.results);
        console.log('[ISSUE DETAIL] Status IDs (UUIDs):', response.results.map((s: any) => ({ id: s.id, name: s.name, color: s.color })));
        this.workflowStatuses.set(response.results || []);
      }
    } catch (error) {
      console.error('[ISSUE DETAIL] ❌ Error loading workflow statuses:', error);
    }
  }
  
  getIssueTypeIcon(category?: string): string {
    // Removed emojis - using text only for professional look
    return '';
  }
  
  getIssueTypeBadgeClass(category?: string): string {
    switch (category?.toLowerCase()) {
      case 'bug': return 'bg-red-100 text-red-700';
      case 'task': return 'bg-blue-100 text-blue-700';
      case 'story': return 'bg-purple-100 text-purple-700';
      case 'epic': return 'bg-indigo-100 text-indigo-700';
      case 'improvement': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getPriorityClass(priority: string): string {
    // Use utility function for consistent styling
    return getPriorityTailwindClasses(priority);
  }

  get hasUnsavedChanges(): boolean {
    return this.issueForm.dirty;
  }
}
