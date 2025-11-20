import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {OrganizationService} from '../../../core/services/organization.service';
import {OrganizationInvitation} from '../../../core/models/interfaces';
import {CommonModule} from '@angular/common';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

@Component({
  selector: 'app-organizations-invitations',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './organizations-invitations.component.html',
  styleUrl: './organizations-invitations.component.css',
})
export class OrganizationsInvitationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  token = '';
  invitation: OrganizationInvitation | null = null;
  loading = true;
  error = '';
  actionLoading = false;
  actionMessage = '';
  actionError = '';
  accepted = false;
  rejected = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Token de invitación no proporcionado.';
      this.loading = false;
      return;
    }
    this.fetchInvitation();
  }

  fetchInvitation(): void {
    this.loading = true;
    this.organizationService.getInvitationByToken(this.token).subscribe({
      next: (inv) => {
        this.invitation = inv;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'No se pudo cargar la invitación.';
        this.loading = false;
      },
    });
  }

  acceptInvitation(): void {
    if (!this.invitation) return;
    this.actionLoading = true;
    this.actionError = '';
    this.organizationService.acceptInvitation(this.token).subscribe({
      next: () => {
        this.actionMessage = '¡Invitación aceptada! Ya eres miembro de la organización.';
        this.accepted = true;
        this.actionLoading = false;
      },
      error: (err) => {
        this.actionError = err.message || 'No se pudo aceptar la invitación.';
        this.actionLoading = false;
      },
    });
  }

  rejectInvitation(): void {
    if (!this.invitation) return;
    this.actionLoading = true;
    this.actionError = '';
    this.organizationService.rejectInvitation(this.token).subscribe({
      next: () => {
        this.actionMessage = 'Has rechazado la invitación.';
        this.rejected = true;
        this.actionLoading = false;
      },
      error: (err) => {
        this.actionError = err.message || 'No se pudo rechazar la invitación.';
        this.actionLoading = false;
      },
    });
  }
}
