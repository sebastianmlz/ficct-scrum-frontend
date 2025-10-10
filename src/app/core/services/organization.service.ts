import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import {
  Organization,
  OrganizationRequest,
  OrganizationMember,
  OrganizationMemberRequest,
  PatchedOrganizationMemberRequest,
  PaginatedOrganizationList,
  PaginatedOrganizationMemberList,
  PaginationParams,
  OrganizationInvitation,
  OrganizationInvitationRequest,
  OrganizationInvitationResponse,
  PaginatedOrganizationInvitationList
} from '../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/orgs`;

  getOrganizations(params?: PaginationParams): Observable<PaginatedOrganizationList> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }

    return this.http.get<PaginatedOrganizationList>(`${this.baseUrl}/organizations/`, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  getOrganization(id: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.baseUrl}/organizations/${id}/`).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  createOrganization(organizationData: OrganizationRequest): Observable<Organization> {
    console.log('🔧 OrganizationService - Datos recibidos:', organizationData);
    
    // Si NO hay logo, enviar como JSON normal
    if (!organizationData.logo) {
      const jsonData = {
        name: organizationData.name,
        slug: organizationData.slug,
        description: organizationData.description || '',
        organization_type: organizationData.organization_type || '',
        subscription_plan: organizationData.subscription_plan || '',
        website_url: organizationData.website_url || '',
        is_active: organizationData.is_active ?? true
      };

      console.log('📤 Enviando como JSON (sin logo):', jsonData);

      return this.http.post<Organization>(`${this.baseUrl}/organizations/`, jsonData, {
        headers: { 'Content-Type': 'application/json' }
      }).pipe(
        catchError(this.handleError)
      );
    }

    // Si HAY logo, enviar como FormData
    const formData = new FormData();
    
    formData.append('name', organizationData.name);
    formData.append('slug', organizationData.slug);
    
    if (organizationData.description) {
      formData.append('description', organizationData.description);
    }
    if (organizationData.website_url) {
      formData.append('website_url', organizationData.website_url);
    }
    if (organizationData.organization_type) {
      formData.append('organization_type', organizationData.organization_type);
    }
    if (organizationData.subscription_plan) {
      formData.append('subscription_plan', organizationData.subscription_plan);
    }
    if (organizationData.is_active !== undefined) {
      formData.append('is_active', organizationData.is_active.toString());
    }
    
    // Agregar logo al final y con validación
    if (organizationData.logo && organizationData.logo instanceof File) {
      console.log('📸 Agregando logo - Nombre:', organizationData.logo.name, 'Tamaño:', organizationData.logo.size, 'Tipo:', organizationData.logo.type);
      
      // Validar que el archivo sea una imagen
      if (organizationData.logo.type.startsWith('image/')) {
        formData.append('logo', organizationData.logo, organizationData.logo.name);
      } else {
        console.error('❌ El archivo no es una imagen válida:', organizationData.logo.type);
        return throwError(() => new Error('El archivo debe ser una imagen válida'));
      }
    }

    // Log FormData contents (excluyendo el archivo para evitar problemas)
    console.log('📋 FormData contents:');
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}:`, `[File: ${pair[1].name}, ${pair[1].size} bytes, ${pair[1].type}]`);
      } else {
        console.log(`${pair[0]}:`, pair[1]);
      }
    }

    const url = `${this.baseUrl}/organizations/`;
    console.log('🌐 POST URL (con FormData):', url);

    // Enviar FormData SIN headers explícitos (dejar que el navegador los configure)
    return this.http.post<Organization>(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  updateOrganization(id: string, organizationData: Partial<OrganizationRequest>): Observable<Organization> {
    const formData = new FormData();
    
    if (organizationData.name) {
      formData.append('name', organizationData.name);
    }
    if (organizationData.slug) {
      formData.append('slug', organizationData.slug);
    }
    if (organizationData.description) {
      formData.append('description', organizationData.description);
    }
    if (organizationData.logo) {
      formData.append('logo', organizationData.logo);
    }
    if (organizationData.website_url) {
      formData.append('website_url', organizationData.website_url);
    }
    if (organizationData.organization_type) {
      formData.append('organization_type', organizationData.organization_type);
    }
    if (organizationData.subscription_plan) {
      formData.append('subscription_plan', organizationData.subscription_plan);
    }
    if (organizationData.organization_settings) {
      formData.append('organization_settings', JSON.stringify(organizationData.organization_settings));
    }
    if (organizationData.is_active !== undefined) {
      formData.append('is_active', organizationData.is_active.toString());
    }

    return this.http.patch<Organization>(`${this.baseUrl}/organizations/${id}/`, formData).pipe(
      catchError(this.handleError)
    );
  }

  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  // Organization Members
  getOrganizationMembers(organizationId: string, params?: PaginationParams): Observable<PaginatedOrganizationMemberList> {
    let httpParams = new HttpParams();
    
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }
    if (params?.role) {
      httpParams = httpParams.set('role', params.role);
    }

    return this.http.get<PaginatedOrganizationMemberList>(`${this.baseUrl}/organizations/${organizationId}/members/`, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  addOrganizationMember(_organizationId: string, memberData: any): Observable<OrganizationMember> {
    // El backend espera POST a /api/v1/orgs/members/ con email, role, status, is_active
    const url = `${this.baseUrl}/members/`;
    return this.http.post<OrganizationMember>(url, memberData).pipe(
      catchError(this.handleError)
    );
  }

  updateOrganizationMemberRole(organizationId: string, memberId: string, roleData: PatchedOrganizationMemberRequest): Observable<OrganizationMember> {
    return this.http.patch<OrganizationMember>(`${this.baseUrl}/organizations/${organizationId}/members/${memberId}/`, roleData).pipe(
      catchError(this.handleError)
    );
  }

  removeOrganizationMember(organizationId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${organizationId}/members/${memberId}/`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza el rol de un miembro usando el endpoint PATCH /api/v1/orgs/members/{id}/update-role/
   */
  updateOrganizationMemberRoleById(memberId: string, roleData: { role: string }): Observable<OrganizationMember> {
    const url = `${this.baseUrl}/members/${memberId}/update-role/`;
    return this.http.patch<OrganizationMember>(url, roleData).pipe(
      catchError(this.handleError)
    );
  }

  // --- Organization Invitations ---
  sendInvitation(organizationId: string, invitationData: OrganizationInvitationRequest): Observable<OrganizationInvitationResponse> {
    // POST /api/v1/orgs/invitations/
    const url = `${this.baseUrl}/invitations/`;
    const body = {
      organization: organizationId,
      email: invitationData.email,
      role: invitationData.role
    };
    console.log('📤 Enviando invitación:', body);
    return this.http.post<OrganizationInvitationResponse>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  getInvitations(organizationId: string, params?: PaginationParams): Observable<PaginatedOrganizationInvitationList> {
    // GET /api/v1/orgs/invitations/?organization={id}
    let httpParams = new HttpParams();
    httpParams = httpParams.set('organization', organizationId);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.ordering) httpParams = httpParams.set('ordering', params.ordering);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    const url = `${this.baseUrl}/invitations/`;
    console.log('🔍 getInvitations URL:', url);
    console.log('🔍 getInvitations params:', httpParams.toString());
    return this.http.get<PaginatedOrganizationInvitationList>(url, { params: httpParams }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  cancelInvitation(organizationId: string, invitationId: string): Observable<void> {
    // DELETE /api/v1/orgs/invitations/{invitation_id}/
    const url = `${this.baseUrl}/invitations/${invitationId}/`;
    console.log('🗑️ Cancelando invitación:', url);
    return this.http.delete<void>(url).pipe(
      catchError(this.handleError)
    );
  }

  resendInvitation(organizationId: string, invitationId: string): Observable<OrganizationInvitationResponse> {
    // POST /api/v1/orgs/invitations/{invitation_id}/resend/
    const url = `${this.baseUrl}/invitations/${invitationId}/resend/`;
    console.log('📧 Reenviando invitación:', url);
    return this.http.post<OrganizationInvitationResponse>(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  // --- Invitaciones por token (aceptar/rechazar) ---
  getInvitationByToken(token: string): Observable<OrganizationInvitation> {
    // GET /api/v1/orgs/invitations/:token/
    const url = `${this.baseUrl}/invitations/${token}/`;
    return this.http.get<OrganizationInvitation>(url).pipe(
      catchError(this.handleError)
    );
  }

  acceptInvitation(token: string): Observable<any> {
    // POST /api/v1/orgs/invitations/:token/accept/
    const url = `${this.baseUrl}/invitations/${token}/accept/`;
    return this.http.post(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  rejectInvitation(token: string): Observable<any> {
    // POST /api/v1/orgs/invitations/:token/reject/
    const url = `${this.baseUrl}/invitations/${token}/reject/`;
    return this.http.post(url, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('🚨 OrganizationService error:', error);
    console.error('🚨 Error details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          const validationErrors = error.error?.errors || error.error;
          if (typeof validationErrors === 'object') {
            const errorMessages = Object.entries(validationErrors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            errorMessage = `Validation errors: ${errorMessages}`;
          } else {
            errorMessage = 'Invalid request. Please check your input.';
          }
          break;
        case 401:
          errorMessage = 'You are not authorized to access this resource.';
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Organization not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
