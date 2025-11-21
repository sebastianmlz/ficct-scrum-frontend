import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  totalUsers = signal(0);
  totalOrganizations = signal(0);
  totalProjects = signal(0);
  systemErrors = signal(0);

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    // Placeholder data - replace with actual API calls
    this.totalUsers.set(142);
    this.totalOrganizations.set(23);
    this.totalProjects.set(89);
    this.systemErrors.set(3);
  }
}
