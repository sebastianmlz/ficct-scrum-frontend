import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrganizationService } from '../../../core/services/organization.service';
import { OrganizationMember, PaginatedOrganizationMemberList } from '../../../core/models/interfaces';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
    
@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [CommonModule, TableModule, ProgressSpinnerModule],
  templateUrl: './organization-members.component.html',
  styleUrl: './organization-members.component.css'
})
export class OrganizationMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);

  organizationId = '';
  members: OrganizationMember[] = [];
  loading = true;
  error = '';
  page = 1;
  total = 0;

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.paramMap.get('id') || '';
    this.loadMembers();
  }

  loadMembers(page: number = 1): void {
    this.loading = true;
    this.error = '';
    this.organizationService.getOrganizationMembers(this.organizationId, { page }).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.members = res;
          this.total = res.length;
        } else if (res && Array.isArray(res.results)) {
          this.members = res.results;
          this.total = res.count || res.results.length;
        } else {
          this.members = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar miembros';
        this.loading = false;
      }
    });
  }
}
