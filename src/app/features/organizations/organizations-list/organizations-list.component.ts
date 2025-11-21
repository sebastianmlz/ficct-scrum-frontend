import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {OrganizationService} from '../../../core/services/organization.service';
import {Organization, PaginatedOrganizationList, PaginationParams}
  from '../../../core/models/interfaces';

@Component({
  selector: 'app-organizations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './organizations-list.component.html',
})
export class OrganizationsListComponent implements OnInit {
  private organizationService = inject(OrganizationService);
  private fb = inject(FormBuilder);

  organizations = signal<Organization[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  paginationData = signal<PaginatedOrganizationList | null>(null);
  currentPage = signal(1);

  searchForm: FormGroup = this.fb.group({
    search: [''],
    ordering: ['-created_at'],
  });

  Math = Math;

  ngOnInit(): void {
    this.loadOrganizations();
  }

  async loadOrganizations(params?: PaginationParams): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.organizationService.getOrganizations(params)
          .toPromise();
      if (response) {
        this.organizations.set(response.results);
        this.paginationData.set(response);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load organizations');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    const searchParams: PaginationParams = {
      page: 1,
      search: this.searchForm.value.search || undefined,
      ordering: this.searchForm.value.ordering || undefined,
    };

    this.currentPage.set(1);
    this.loadOrganizations(searchParams);
  }

  loadPage(page: number): void {
    if (page < 1) return;

    const searchParams: PaginationParams = {
      page,
      search: this.searchForm.value.search || undefined,
      ordering: this.searchForm.value.ordering || undefined,
    };

    this.currentPage.set(page);
    this.loadOrganizations(searchParams);
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ?
      'bg-green-100 text-green-800' :
      'bg-red-100 text-red-800';
  }
}
