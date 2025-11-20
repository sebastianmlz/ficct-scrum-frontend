import {Injectable, OnDestroy} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {WebSocketService} from '../../../core/services/websocket.service';
import {
  WebSocketMessage,
  UserJoinedData,
  IssueMovedData,
  IssueCreatedData,
  IssueUpdatedData,
  IssueDeletedData,
  ColumnCreatedData,
  ColumnUpdatedData,
  ColumnDeletedData,
} from '../../../core/models/interfaces';
import {environment} from '../../../../environments/environment';

@Injectable()
export class BoardWebSocketService implements OnDestroy {
  private currentBoardId: string | null = null;
  private connectedSubject$ = new BehaviorSubject<boolean>(false);

  public connected$ = this.connectedSubject$.asObservable();

  constructor(private wsService: WebSocketService) {}

  /**
   * Conectar al WebSocket del board
   * @param boardId ID del board
   * @param token JWT token para autenticación
   */
  connectToBoard(boardId: string, token: string): void {
    if (this.currentBoardId === boardId && this.wsService.isConnected()) {
      console.log('[BOARD-WS] Already connected to board:', boardId);
      return; // Ya conectado al mismo board
    }

    // Desconectar del board anterior si existe
    if (this.currentBoardId) {
      this.disconnectFromBoard();
    }

    this.currentBoardId = boardId;
    const wsUrl = `${environment.wsUrl}/ws/boards/${boardId}/?token=${token}`;

    console.log('[BOARD-WS] Connecting to board:', boardId);
    console.log('[BOARD-WS] Environment wsUrl:', environment.wsUrl);
    console.log('[BOARD-WS] Token received - Length:', token.length, '| First 30 chars:', token.substring(0, 30) + '...');
    console.log('[BOARD-WS] Token format valid (starts with eyJ):', token.startsWith('eyJ'));
    console.log('[BOARD-WS] Full WebSocket URL:', wsUrl.replace(token, token.substring(0, 20) + '...[CENSORED]'));

    this.wsService.connect(wsUrl);
    this.connectedSubject$.next(true);
  }

  /**
   * Desconectar del board actual
   */
  disconnectFromBoard(): void {
    this.wsService.disconnect();
    this.currentBoardId = null;
    this.connectedSubject$.next(false);
  }

  /**
   * Observable de mensajes filtrados por tipo
   */
  private onEvent<T>(eventType: string): Observable<T> {
    return this.wsService.messages$.pipe(
        filter((msg: WebSocketMessage) => {
          const matches = msg.type === eventType;
          if (matches) {
            console.log(`[BOARD-WS] Event matched: ${eventType}`, msg.data);
          }
          return matches;
        }),
        map((msg: WebSocketMessage) => msg.data as T),
    );
  }

  /**
   * Usuario se unió al board
   */
  onUserJoined(): Observable<UserJoinedData> {
    return this.onEvent<UserJoinedData>('user.joined');
  }

  /**
   * Usuario salió del board
   */
  onUserLeft(): Observable<UserJoinedData> {
    return this.onEvent<UserJoinedData>('user.left');
  }

  /**
   * Issue movido entre columnas
   */
  onIssueMoved(): Observable<IssueMovedData> {
    return this.onEvent<IssueMovedData>('issue.moved');
  }

  /**
   * Issue creado
   */
  onIssueCreated(): Observable<IssueCreatedData> {
    return this.onEvent<IssueCreatedData>('issue.created');
  }

  /**
   * Issue actualizado
   */
  onIssueUpdated(): Observable<IssueUpdatedData> {
    return this.onEvent<IssueUpdatedData>('issue.updated');
  }

  /**
   * Issue eliminado
   */
  onIssueDeleted(): Observable<IssueDeletedData> {
    return this.onEvent<IssueDeletedData>('issue.deleted');
  }

  /**
   * Columna creada
   */
  onColumnCreated(): Observable<ColumnCreatedData> {
    return this.onEvent<ColumnCreatedData>('column.created');
  }

  /**
   * Columna actualizada
   */
  onColumnUpdated(): Observable<ColumnUpdatedData> {
    return this.onEvent<ColumnUpdatedData>('column.updated');
  }

  /**
   * Columna eliminada
   */
  onColumnDeleted(): Observable<ColumnDeletedData> {
    return this.onEvent<ColumnDeletedData>('column.deleted');
  }

  ngOnDestroy(): void {
    this.disconnectFromBoard();
  }
}
