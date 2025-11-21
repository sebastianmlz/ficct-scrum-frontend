import {Injectable, inject} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {
  Board,
  BoardColumn,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateColumnRequest,
  UpdateColumnRequest,
  MoveIssueRequest,
  Issue,
  CreateIssueQuickRequest,
  PaginationParams,
  PaginatedBoardList,
  PaginatedIssueList,
} from '../models/interfaces';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/projects`;

  // Board CRUD operations
  getBoards(params?: PaginationParams & { project?: string;
    board_type?: string }): Observable<Board[]> {
    let httpParams = new HttpParams();

    if (params?.project) {
      httpParams = httpParams.set('project', params.project);
    }
    if (params?.board_type) {
      httpParams = httpParams.set('board_type', params.board_type);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<PaginatedBoardList>(`${
      this.baseUrl}/boards/`, {params: httpParams})
        .pipe(
            map((response) => response.results),
        );
  }

  getBoardById(boardId: string): Observable<Board> {
    return this.http.get<Board>(`${this.baseUrl}/boards/${boardId}/`);
  }

  createBoard(boardData: CreateBoardRequest): Observable<Board> {
    return this.http.post<Board>(`${this.baseUrl}/boards/`, boardData);
  }

  updateBoard(boardId: string, boardData: UpdateBoardRequest)
  : Observable<Board> {
    return this.http.patch<Board>(`${
      this.baseUrl}/boards/${boardId}/`, boardData);
  }

  deleteBoard(boardId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/boards/${boardId}/`);
  }

  // Column operations
  getColumns(boardId: string): Observable<BoardColumn[]> {
    return this.http.get<BoardColumn[]>(`${
      this.baseUrl}/boards/${boardId}/columns/`);
  }

  createColumn(boardId: string, columnData: CreateColumnRequest)
  : Observable<BoardColumn> {
    return this.http.post<BoardColumn>(`${
      this.baseUrl}/boards/${boardId}/columns/`, columnData);
  }

  updateColumn(boardId: string, columnId: string,
      columnData: UpdateColumnRequest): Observable<BoardColumn> {
    return this.http.patch<BoardColumn>(`${
      this.baseUrl}/boards/${boardId}/columns/${columnId}/`, columnData);
  }

  deleteColumn(boardId: string, columnId: string): Observable<void> {
    return this.http.delete<void>(`${
      this.baseUrl}/boards/${boardId}/columns/${columnId}/`);
  }

  // Issue operations in board context
  createIssue(boardId: string, issueData: CreateIssueQuickRequest)
  : Observable<Issue> {
    return this.http.post<Issue>(`${
      this.baseUrl}/boards/${boardId}/issues/`, issueData);
  }

  moveIssue(boardId: string, issueId: string, moveData: MoveIssueRequest)
  : Observable<Issue> {
    return this.http.patch<Issue>(`${
      this.baseUrl}/boards/${boardId}/issues/${issueId}/move/`, moveData);
  }

  getIssuesByBoard(boardId: string, filters?: {
    assignee?: string;
    priority?: string;
    issue_type?: string;
    search?: string;
  }): Observable<Issue[]> {
    let httpParams = new HttpParams().set('board', boardId);

    if (filters?.assignee) {
      httpParams = httpParams.set('assignee', filters.assignee);
    }
    if (filters?.priority) {
      httpParams = httpParams.set('priority', filters.priority);
    }
    if (filters?.issue_type) {
      httpParams = httpParams.set('issue_type', filters.issue_type);
    }
    if (filters?.search) {
      httpParams = httpParams.set('search', filters.search);
    }

    return this.http.get<PaginatedIssueList>(`${
      this.baseUrl}/issues/`, {params: httpParams})
        .pipe(
            map((response) => response.results),
        );
  }
}
