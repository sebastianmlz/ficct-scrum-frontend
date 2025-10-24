import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { BoardService } from '../../../../core/services/board.service';
import { BoardWebSocketService } from '../../services/board-websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { getAllPriorities, getPriorityLabel } from '../../../../shared/utils/priority.utils';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  Board,
  BoardColumn,
  Issue,
  UserJoinedData
} from '../../../../core/models/interfaces';
import { BoardColumnComponent } from '../board-column/board-column.component';
import { BoardFilterToolbarComponent, BoardFilters as ToolbarFilters } from '../board-filter-toolbar/board-filter-toolbar.component';
import { CreateColumnDialogComponent } from '../create-column-dialog/create-column-dialog.component';
import { CreateIssueDialogComponent } from '../create-issue-dialog/create-issue-dialog.component';
import { IssueDetailModalComponent } from '../issue-detail-modal/issue-detail-modal.component';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [CommonModule, BoardColumnComponent, BoardFilterToolbarComponent, CreateColumnDialogComponent, CreateIssueDialogComponent, IssueDetailModalComponent],
  providers: [BoardWebSocketService],
  templateUrl: './board-detail.component.html',
})
export class BoardDetailComponent implements OnInit, OnDestroy {
  private boardService = inject(BoardService);
  private boardWsService = inject(BoardWebSocketService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private http = inject(HttpClient);  // ✅ Inyectado en field initializer
  private destroy$ = new Subject<void>();

  // Signals para state management
  board = signal<Board | null>(null);
  columns = signal<BoardColumn[]>([]);
  issuesByColumn = signal<Map<string, Issue[]>>(new Map());
  activeUsers = signal<UserJoinedData[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  wsConnected = signal(false);
  showCreateColumnDialog = signal(false);
  showCreateIssueDialog = signal(false);
  createIssueColumnId = signal<string | null>(null);
  showIssueDetailModal = signal(false);
  selectedIssueId = signal<string | null>(null);

  // Computed signals
  connectedDropLists = computed(() => {
    return this.columns().map(col => col.id);
  });

  currentUserId: string = '';
  boardId: string = '';

  ngOnInit(): void {
    // Get current user
    const user = this.authService.getUser();
    if (user?.id) {
      this.currentUserId = user.id.toString();
    }

    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.filters.update(f => ({ ...f, search: term }));
    });

    this.route.params.subscribe(params => {
      this.boardId = params['boardId'];
      if (this.boardId) {
        this.loadBoard();
        this.connectWebSocket();
        this.subscribeToWebSocketEvents();
      }
    });
  }
  
  ngAfterViewInit(): void {
    // Load filter options after board is loaded
    setTimeout(() => {
      this.loadFilterOptions();
    }, 1000);
  }

  async loadBoard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Cargar board con columnas
      const boardData = await this.boardService.getBoardById(this.boardId).toPromise();
      
      if (boardData) {
        this.board.set(boardData);
        
        // Ordenar columnas por order
        const sortedColumns = (boardData.columns || []).sort((a, b) => a.order - b.order);
        this.columns.set(sortedColumns);

        // Cargar issues del board
        await this.loadIssues();
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load board');
    } finally {
      this.loading.set(false);
    }
  }

  async loadIssues(): Promise<void> {
    try {
      const issues = await this.boardService.getIssuesByBoard(this.boardId).toPromise();
      
      if (issues) {
        this.organizeIssuesByColumn(issues);
      }
    } catch (error: any) {
      console.error('Error loading issues:', error);
    }
  }

  private organizeIssuesByColumn(issues: Issue[]): void {
    const issuesMap = new Map<string, Issue[]>();
    
    // Inicializar mapa con columnas vacías
    this.columns().forEach(column => {
      issuesMap.set(column.workflow_status.id, []);
    });

    // Organizar issues por status
    issues.forEach(issue => {
      if (issue.status?.id) {
        const columnIssues = issuesMap.get(issue.status.id) || [];
        columnIssues.push(issue);
        issuesMap.set(issue.status.id, columnIssues);
      }
    });

    this.issuesByColumn.set(issuesMap);
  }

  private connectWebSocket(): void {
    const token = this.authService.getToken();
    console.log('[BOARD-DETAIL] Obtained token from authService:', token ? `${token.substring(0, 30)}... (length: ${token.length})` : 'NULL/UNDEFINED');
    
    if (token) {
      console.log('[BOARD-DETAIL] Token is valid, connecting to WebSocket...');
      this.boardWsService.connectToBoard(this.boardId, token);
      
      this.boardWsService.connected$
        .pipe(takeUntil(this.destroy$))
        .subscribe(connected => {
          this.wsConnected.set(connected);
        });
    } else {
      console.error('[BOARD-DETAIL] ❌ CRITICAL: Token is NULL/UNDEFINED - Cannot connect to WebSocket!');
      console.error('[BOARD-DETAIL] User might not be logged in or token is not stored correctly');
      console.error('[BOARD-DETAIL] Check localStorage.getItem("access") in DevTools console');
      this.notificationService.error('Authentication required. Please login again.');
    }
  }

  private subscribeToWebSocketEvents(): void {
    console.log('[BOARD-DETAIL] Subscribing to WebSocket events...');
    
    // Usuario se unió
    this.boardWsService.onUserJoined()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] User joined event:', data);
        this.activeUsers.update(users => [...users, data]);
        this.notificationService.info(`${data.user_name} joined the board`);
      });

    // Usuario salió
    this.boardWsService.onUserLeft()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.activeUsers.update(users => users.filter(u => u.user_id !== data.user_id));
        this.notificationService.info(`${data.user_name} left the board`);
      });

    // Issue movido
    this.boardWsService.onIssueMoved()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Issue moved event:', data);
        console.log('[BOARD-DETAIL] Current user ID:', this.currentUserId);
        console.log('[BOARD-DETAIL] Event user ID:', data.user.id);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing issue moved (from other user)');
          this.handleIssueMovedEvent(data);
          this.notificationService.info(`${data.user.name} moved issue ${data.issue.title}`);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });

    // Issue creado
    this.boardWsService.onIssueCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Issue created event:', data);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing issue created (from other user)');
          this.handleIssueCreatedEvent(data);
          this.notificationService.info(`${data.user.name} created issue ${data.issue.title}`);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });

    // Issue actualizado
    this.boardWsService.onIssueUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Issue updated event:', data);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing issue updated (from other user)');
          this.handleIssueUpdatedEvent(data);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });

    // Issue eliminado
    this.boardWsService.onIssueDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Issue deleted event:', data);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing issue deleted (from other user)');
          this.handleIssueDeletedEvent(data);
          this.notificationService.info(`${data.user.name} deleted issue ${data.issue_key}`);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });

    // Columna creada
    this.boardWsService.onColumnCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Column created event:', data);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing column created (from other user)');
          this.handleColumnCreatedEvent(data);
          this.notificationService.info(`${data.user.name} created column ${data.column.name}`);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });

    // Columna actualizada
    this.boardWsService.onColumnUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Column updated event:', data);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing column updated (from other user)');
          this.handleColumnUpdatedEvent(data);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });

    // Columna eliminada
    this.boardWsService.onColumnDeleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        console.log('[BOARD-DETAIL] Column deleted event:', data);
        
        if (data.user.id !== this.currentUserId) {
          console.log('[BOARD-DETAIL] Processing column deleted (from other user)');
          this.handleColumnDeletedEvent(data);
          this.notificationService.info(`Column deleted`);
        } else {
          console.log('[BOARD-DETAIL] Ignoring own event');
        }
      });
  }

  // Event handlers
  private handleIssueMovedEvent(data: any): void {
    console.log('[WS] Handling issue moved:', data);
    console.log('[WS] From status:', data.from_status, 'To status:', data.to_status);
    
    // ✅ Actualizar signal inmutablemente
    this.issuesByColumn.update(currentMap => {
      const newMap = new Map<string, Issue[]>();
      
      // Copiar todos los arrays
      for (const [columnId, issues] of currentMap.entries()) {
        newMap.set(columnId, [...issues]);
      }
      
      // Remover de columna anterior
      const fromIssues = newMap.get(data.from_status) || [];
      const updatedFromIssues = fromIssues.filter(i => i.id !== data.issue.id);
      newMap.set(data.from_status, updatedFromIssues);

      // Agregar a nueva columna
      const toIssues = newMap.get(data.to_status) || [];
      toIssues.push(data.issue);
      newMap.set(data.to_status, toIssues);

      console.log('[WS] ✅ Issue moved in signal');
      return newMap;
    });
  }

  private handleIssueCreatedEvent(data: any): void {
    console.log('[WS] Handling issue created:', data);
    const statusId = data.issue.status?.id;
    
    if (statusId) {
      // ✅ Actualizar signal inmutablemente
      this.issuesByColumn.update(currentMap => {
        const newMap = new Map<string, Issue[]>();
        
        // Copiar todos los arrays
        for (const [columnId, issues] of currentMap.entries()) {
          newMap.set(columnId, [...issues]);
        }
        
        // Agregar issue a columna
        const columnIssues = newMap.get(statusId) || [];
        columnIssues.push(data.issue);
        newMap.set(statusId, columnIssues);
        
        console.log('[WS] ✅ Issue created in signal');
        return newMap;
      });
    } else {
      console.warn('[WS] ⚠️ Issue has no status ID:', data.issue);
    }
  }

  private handleIssueUpdatedEvent(data: any): void {
    console.log('[WS] Handling issue updated:', data);
    
    // ✅ Actualizar signal inmutablemente
    this.issuesByColumn.update(currentMap => {
      const newMap = new Map<string, Issue[]>();
      
      // Copiar todos los arrays
      for (const [columnId, issues] of currentMap.entries()) {
        newMap.set(columnId, [...issues]);
      }
      
      // Buscar y actualizar el issue en todas las columnas
      for (const [statusId, issues] of newMap.entries()) {
        const index = issues.findIndex(i => i.id === data.issue.id);
        if (index !== -1) {
          // Reemplazar issue en array copiado
          issues[index] = data.issue;
          console.log('[WS] ✅ Issue updated in signal');
          break;
        }
      }
      
      return newMap;
    });
  }

  private handleIssueDeletedEvent(data: any): void {
    console.log('[WS] Handling issue deleted:', data.issue_id);
    
    // ✅ Actualizar signal inmutablemente
    this.issuesByColumn.update(currentMap => {
      const newMap = new Map<string, Issue[]>();
      
      // Copiar todos los arrays y filtrar el issue eliminado
      for (const [statusId, issues] of currentMap.entries()) {
        const filtered = issues.filter(i => i.id !== data.issue_id);
        newMap.set(statusId, filtered);
      }
      
      console.log('[WS] ✅ Issue deleted from signal');
      return newMap;
    });
  }

  private handleColumnCreatedEvent(data: any): void {
    this.columns.update(cols => {
      const newCols = [...cols, data.column];
      return newCols.sort((a, b) => a.order - b.order);
    });
    
    // Inicializar issues para la nueva columna - inmutablemente
    this.issuesByColumn.update(currentMap => {
      const newMap = new Map(currentMap);
      newMap.set(data.column.workflow_status.id, []);
      return newMap;
    });
  }

  private handleColumnUpdatedEvent(data: any): void {
    this.columns.update(cols => {
      const index = cols.findIndex(c => c.id === data.column.id);
      if (index !== -1) {
        const updated = [...cols];
        updated[index] = data.column;
        return updated.sort((a, b) => a.order - b.order);
      }
      return cols;
    });
  }

  private handleColumnDeletedEvent(data: any): void {
    this.columns.update(cols => cols.filter(c => c.id !== data.column_id));
  }

  getIssuesForColumn(column: BoardColumn): Issue[] {
    const allIssues = this.issuesByColumn().get(column.workflow_status.id) || [];
    return this.applyFilters(allIssues);
  }
  
  private applyFilters(issues: Issue[]): Issue[] {
    const currentFilters = this.filters();
    
    return issues.filter(issue => {
      // Search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const matchesSearch = 
          issue.title.toLowerCase().includes(searchLower) ||
          (issue.key && issue.key.toLowerCase().includes(searchLower)) ||
          (issue.id && issue.id.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      // Assignee filter
      if (currentFilters.assignees.length > 0) {
        const issueAssigneeId = issue.assignee?.user_uuid || (issue.assignee?.id ? String(issue.assignee.id) : null);
        const matchesAssignee = 
          (issueAssigneeId && currentFilters.assignees.includes(issueAssigneeId)) ||
          (currentFilters.assignees.includes('unassigned') && !issue.assignee);
        if (!matchesAssignee) return false;
      }
      
      // Priority filter
      if (currentFilters.priorities.length > 0) {
        if (!issue.priority || !currentFilters.priorities.includes(issue.priority)) {
          return false;
        }
      }
      
      // Issue type filter
      if (currentFilters.issueTypes.length > 0) {
        if (!issue.issue_type?.id || !currentFilters.issueTypes.includes(issue.issue_type.id)) {
          return false;
        }
      }
      
      // Status filter (redundant in column view but useful for cross-column filtering)
      if (currentFilters.statuses.length > 0) {
        if (!issue.status?.id || !currentFilters.statuses.includes(issue.status.id)) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  onSearchChange(searchTerm: string | Event): void {
    const value = typeof searchTerm === 'string' 
      ? searchTerm 
      : (searchTerm.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onToolbarFiltersChanged(toolbarFilters: ToolbarFilters): void {
    console.log('[BOARD] Toolbar filters changed:', toolbarFilters);
    
    // Sync toolbar filters to internal filters signal
    this.filters.set({
      search: toolbarFilters.search,
      assignees: toolbarFilters.assignees,
      priorities: toolbarFilters.priorities,
      issueTypes: toolbarFilters.issueTypes,
      statuses: toolbarFilters.statuses
    });
    
    console.log('[BOARD] Internal filters updated:', this.filters());
  }
  
  // Métodos de filtrado ahora manejados por BoardFilterToolbarComponent
  
  getFilteredIssuesCount(): number {
    let total = 0;
    this.columns().forEach(column => {
      total += this.getIssuesForColumn(column).length;
    });
    return total;
  }
  
  getTotalIssuesCount(): number {
    let total = 0;
    this.issuesByColumn().forEach(issues => {
      total += issues.length;
    });
    return total;
  }

  // User actions
  async onIssueDropped(event: { issueId: string; targetColumnId: string; targetStatusId: string; previousStatusId?: string }): Promise<void> {
    console.log('[DROP] === INICIO DROP ===');
    console.log('[DROP] Event:', event);
    console.log('[DROP] Issue ID:', event.issueId);
    console.log('[DROP] Target column ID:', event.targetColumnId);
    console.log('[DROP] Target status ID:', event.targetStatusId);
    
    // Guardar estado anterior para rollback si falla
    const previousState = new Map(this.issuesByColumn());
    
    // ✅ ACTUALIZACIÓN INMUTABLE DEL SIGNAL
    // Actualizar signal ANTES de API call (optimistic update)
    console.log('[DROP] Actualizando signal de forma inmutable...');
    
    this.issuesByColumn.update(currentMap => {
      // 1. Crear NUEVO Map
      const newMap = new Map<string, Issue[]>();
      
      // 2. Copiar TODOS los arrays con spread (crear copias)
      for (const [columnId, issues] of currentMap.entries()) {
        newMap.set(columnId, [...issues]);
      }
      
      // 3. Encontrar el issue en TODAS las columnas
      let movedIssue: Issue | null = null;
      let sourceStatusId: string | null = null;
      
      for (const [statusId, issues] of newMap.entries()) {
        const index = issues.findIndex(i => i.id === event.issueId);
        if (index !== -1) {
          // Encontrado! Remover de esta columna
          movedIssue = issues[index];
          sourceStatusId = statusId;
          issues.splice(index, 1);
          console.log('[DROP] Issue removido de columna:', statusId);
          break;
        }
      }
      
      if (!movedIssue || !sourceStatusId) {
        console.error('[DROP] ❌ Issue NO encontrado en ningúna columna!');
        return currentMap; // No cambiar nada
      }
      
      // 4. Actualizar status del issue (mantener estructura completa del status)
      const updatedIssue: Issue = {
        ...movedIssue,
        status: {
          id: event.targetStatusId,
          name: movedIssue.status?.name || '',
          category: movedIssue.status?.category || '',
          color: movedIssue.status?.color || '',
          is_initial: movedIssue.status?.is_initial || false,
          is_final: movedIssue.status?.is_final || false
        }
      };
      
      // 5. Agregar a columna target
      const targetIssues = newMap.get(event.targetStatusId) || [];
      targetIssues.push(updatedIssue);
      newMap.set(event.targetStatusId, targetIssues);
      
      console.log('[DROP] ✅ Issue movido en signal inmutable');
      console.log('[DROP]    From:', sourceStatusId, 'To:', event.targetStatusId);
      console.log('[DROP]    Issue:', updatedIssue.id, updatedIssue.title);
      
      // 6. Retornar NUEVO Map - signal detecta cambio!
      return newMap;
    });
    
    // Persistir en backend
    try {
      console.log('[DROP] Llamando API para persistir cambio...');
      
      const response = await this.boardService.moveIssue(this.boardId, event.issueId, {
        column_id: event.targetColumnId
      }).toPromise();
      
      console.log('[DROP] ✅ API Success:', response);
      console.log('[DROP] Issue persistido correctamente en backend');
      console.log('[DROP] === FIN DROP EXITOSO ===');
      
    } catch (error: any) {
      console.error('[DROP] ❌ API Error:', error);
      console.error('[DROP] Error status:', error.status);
      console.error('[DROP] Error body:', error.error);
      
      this.notificationService.error('Failed to move issue');
      
      // ROLLBACK: Restaurar estado anterior
      console.log('[DROP] Ejecutando ROLLBACK - restaurando estado anterior...');
      this.issuesByColumn.set(previousState);
      console.log('[DROP] ✅ Estado restaurado');
      console.log('[DROP] === FIN DROP CON ERROR ===');
    }
  }

  onCreateIssueClicked(columnId: string): void {
    console.log('[BOARD-DETAIL] Opening create issue dialog for column:', columnId);
    this.createIssueColumnId.set(columnId);
    this.showCreateIssueDialog.set(true);
  }

  onIssueCreatedFromDialog(issue: Issue): void {
    console.log('[BOARD-DETAIL] Issue created from dialog:', issue);
    
    // Cerrar modal
    this.showCreateIssueDialog.set(false);
    this.createIssueColumnId.set(null);

    // Agregar issue al estado local
    const statusId = issue.status?.id;
    if (statusId) {
      console.log('[BOARD-DETAIL] Adding issue to column with status:', statusId);
      
      this.issuesByColumn.update(issuesMap => {
        const newMap = new Map(issuesMap);
        const columnIssues = newMap.get(statusId) || [];
        columnIssues.push(issue);
        newMap.set(statusId, columnIssues);
        return newMap;
      });

      console.log('[BOARD-DETAIL] Issue added successfully. Current issues by column:', this.issuesByColumn());
    } else {
      console.warn('[BOARD-DETAIL] Issue has no status, reloading board');
      this.loadBoard(); // Fallback: reload if no status
    }
  }

  onIssueDialogCanceled(): void {
    console.log('[BOARD-DETAIL] Issue dialog canceled');
    this.showCreateIssueDialog.set(false);
    this.createIssueColumnId.set(null);
  }

  onIssueClicked(issue: Issue): void {
    console.log('[BOARD-DETAIL] Opening issue detail modal for:', issue.id);
    this.selectedIssueId.set(issue.id);
    this.showIssueDetailModal.set(true);
  }

  onIssueDetailClosed(): void {
    console.log('[BOARD-DETAIL] Issue detail modal closed');
    this.showIssueDetailModal.set(false);
    this.selectedIssueId.set(null);
  }

  onIssueUpdatedFromModal(issue: Issue): void {
    console.log('[BOARD] === MODAL CERRADO CON UPDATE ===');
    console.log('[BOARD] Result recibido:', issue);
    console.log('[BOARD] Es issue válido?:', !!issue);
    console.log('[BOARD] Issue ID:', issue?.id);
    console.log('[BOARD] Issue assignee:', issue?.assignee);
    console.log('[BOARD] Issue assignee completo:', JSON.stringify(issue?.assignee));
    console.log('[BOARD] Issue status:', issue?.status);
    console.log('[BOARD] Issue status ID:', issue?.status?.id);
    
    // Log estado ANTES de actualizar
    console.log('[BOARD] Estado ANTES de actualizar - Total issues:', Array.from(this.issuesByColumn().values()).flat().length);
    const issueBeforeUpdate = Array.from(this.issuesByColumn().values())
      .flat()
      .find(i => i.id === issue.id);
    console.log('[BOARD] Issue ANTES en estado:', issueBeforeUpdate);
    console.log('[BOARD] Assignee ANTES:', issueBeforeUpdate?.assignee);
    
    // Actualizar el issue en el estado local
    const statusId = issue.status?.id;
    if (statusId) {
      let issueFound = false;
      let oldStatusId = '';
      
      this.issuesByColumn.update(issuesMap => {
        const newMap = new Map(issuesMap);
        
        console.log('[BOARD-DETAIL] Current state columns:', Array.from(newMap.keys()));
        
        // Buscar y actualizar el issue en todas las columnas
        for (const [colStatusId, issues] of newMap.entries()) {
          const index = issues.findIndex(i => i.id === issue.id);
          if (index !== -1) {
            issueFound = true;
            oldStatusId = colStatusId;
            console.log('[BOARD-DETAIL] Found issue at column:', colStatusId, 'index:', index);
            console.log('[BOARD-DETAIL] Old issue data:', issues[index]);
            
            // Si el status cambió, mover a nueva columna
            if (colStatusId !== statusId) {
              console.log('[BOARD-DETAIL] Status changed from', colStatusId, 'to', statusId);
              // Remover de columna actual
              issues.splice(index, 1);
              newMap.set(colStatusId, [...issues]);
              
              // Agregar a nueva columna
              const targetIssues = newMap.get(statusId) || [];
              targetIssues.push(issue);
              newMap.set(statusId, [...targetIssues]);
            } else {
              console.log('[BOARD-DETAIL] Same status, updating in place');
              // Mismo status, solo actualizar con spread para forzar change detection
              const updatedIssues = [...issues];
              updatedIssues[index] = {...issue}; // Clone issue también
              newMap.set(colStatusId, updatedIssues);
            }
            break;
          }
        }
        
        if (!issueFound) {
          console.error('[BOARD] ❌ Issue NOT found in any column!');
        } else {
          console.log('[BOARD] ✅ Issue updated successfully');
        }
        
        return newMap;
      });
      
      // Log estado DESPUÉS de actualizar
      console.log('[BOARD] Estado DESPUÉS de actualizar - Total issues:', Array.from(this.issuesByColumn().values()).flat().length);
      const issueAfterUpdate = Array.from(this.issuesByColumn().values())
        .flat()
        .find(i => i.id === issue.id);
      console.log('[BOARD] Issue DESPUÉS en estado:', issueAfterUpdate);
      console.log('[BOARD] Assignee DESPUÉS:', issueAfterUpdate?.assignee);
      console.log('[BOARD] Assignee DESPUÉS full_name:', issueAfterUpdate?.assignee?.full_name);
      console.log('[BOARD] === FIN UPDATE BOARD ===');
    } else {
      console.error('[BOARD] ❌ Issue has no status ID!');
    }
  }

  onIssueDeletedFromModal(issueId: string): void {
    console.log('[BOARD-DETAIL] Issue deleted from modal:', issueId);
    
    // Remover el issue del estado local
    this.issuesByColumn.update(issuesMap => {
      const newMap = new Map(issuesMap);
      
      for (const [statusId, issues] of newMap.entries()) {
        const filtered = issues.filter(i => i.id !== issueId);
        if (filtered.length !== issues.length) {
          newMap.set(statusId, filtered);
        }
      }
      
      return newMap;
    });
    
    // Cerrar modal
    this.onIssueDetailClosed();
  }

  trackByColumnId(index: number, column: BoardColumn): string {
    return column.id;
  }

  // UI Actions
  // Available options for filters
  availablePriorities = getAllPriorities();
  availableMembers = signal<any[]>([]);
  availableIssueTypes = signal<any[]>([]);
  
  // Filter system
  filters = signal<{
    search: string;
    assignees: string[];
    priorities: string[];
    issueTypes: string[];
    statuses: string[];
  }>({
    search: '',
    assignees: [],
    priorities: [],
    issueTypes: [],
    statuses: []
  });
  
  private searchSubject = new Subject<string>();

  openSettings(): void {
    // Navegar a configuración del proyecto (boards es parte de project settings)
    if (this.board()) {
      this.router.navigate(['/projects', this.board()!.project.id, 'config']);
    }
  }
  
  /**
   * Get priority label for display
   */
  getPriorityLabel(code: string): string {
    return getPriorityLabel(code);
  }
  
  /**
   * Load workspace members for assignee filter
   */
  async loadFilterOptions(): Promise<void> {
    try {
      const board = this.board();
      if (!board) return;
      
      const projectId = board.project.id;
      
      console.log('[FILTERS] Loading filter options for project:', projectId);
      
      // Load project to get workspace - USAR this.http en lugar de inject()
      const project = await this.http.get<any>(
        `${environment.apiUrl}/api/v1/projects/projects/${projectId}/`
      ).toPromise();
      
      if (project?.workspace) {
        console.log('[FILTERS] Loading workspace members for workspace:', project.workspace);
        // Load workspace members
        const membersResponse = await this.http.get<any>(
          `${environment.apiUrl}/api/v1/workspaces/members/?workspace=${project.workspace}`
        ).toPromise();
        
        if (membersResponse?.results) {
          this.availableMembers.set(membersResponse.results);
          console.log('[FILTERS] ✅ Workspace members loaded:', membersResponse.results.length);
        }
      }
      
      // Load issue types
      const typesResponse = await this.http.get<any>(
        `${environment.apiUrl}/api/v1/projects/issue-types/?project=${projectId}`
      ).toPromise();
      
      if (typesResponse?.results) {
        this.availableIssueTypes.set(typesResponse.results);
        console.log('[FILTERS] ✅ Issue types loaded:', typesResponse.results.length);
      }
      
      console.log('[FILTERS] ✅ Filter options loaded successfully');
    } catch (error) {
      console.error('[FILTERS] ❌ Error loading filter options:', error);
    }
  }

  onAddColumn(): void {
    this.showCreateColumnDialog.set(true);
  }

  onColumnCreated(column: BoardColumn): void {
    this.showCreateColumnDialog.set(false);
    // Recargar board para obtener columnas actualizadas
    this.loadBoard();
  }

  onColumnDialogCanceled(): void {
    this.showCreateColumnDialog.set(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.boardWsService.disconnectFromBoard();
  }
}
