import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {OrganizationService} from '../../../core/services/organization.service';
import {Organization} from '../../../core/models/interfaces';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './organization-detail.component.html',
})
export class OrganizationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  organization = signal<Organization | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadOrganization(id);
      }
    });
  }

  async loadOrganization(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const org = await this.organizationService.getOrganization(id)
          .toPromise();
      if (org) {
        this.organization.set(org);
      }
    } catch (error: any) {
      this.error.set(error.error?.message || 'Failed to load organization');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ?
      'bg-green-100 text-green-800' :
      'bg-red-100 text-red-800';
  }
}
