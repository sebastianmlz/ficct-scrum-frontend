import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Organization,
  OrganizationRequest,
  OrganizationMember,
  OrganizationMemberRequest,
  PatchedOrganizationMemberRequest,
  PaginatedOrganizationList,
  PaginatedOrganizationMemberList,
  PaginationParams
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

    return this.http.get<PaginatedOrganizationList>(`${this.baseUrl}/organizations/`, { params: httpParams });
  }

  getOrganization(id: string): Observable<Organization> {
    return this.http.get<Organization>(`${this.baseUrl}/organizations/${id}/`);
  }

  createOrganization(organizationData: OrganizationRequest): Observable<Organization> {
    const formData = new FormData();
    
    formData.append('name', organizationData.name);
    formData.append('slug', organizationData.slug);
    
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

    return this.http.post<Organization>(`${this.baseUrl}/organizations/`, formData);
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

    return this.http.patch<Organization>(`${this.baseUrl}/organizations/${id}/`, formData);
  }

  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${id}/`);
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

    return this.http.get<PaginatedOrganizationMemberList>(`${this.baseUrl}/organizations/${organizationId}/members/`, { params: httpParams });
  }

  addOrganizationMember(organizationId: string, memberData: OrganizationMemberRequest): Observable<OrganizationMember> {
    return this.http.post<OrganizationMember>(`${this.baseUrl}/organizations/${organizationId}/members/`, memberData);
  }

  updateOrganizationMemberRole(organizationId: string, memberId: string, roleData: PatchedOrganizationMemberRequest): Observable<OrganizationMember> {
    return this.http.patch<OrganizationMember>(`${this.baseUrl}/organizations/${organizationId}/members/${memberId}/`, roleData);
  }

  removeOrganizationMember(organizationId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/organizations/${organizationId}/members/${memberId}/`);
  }
}
