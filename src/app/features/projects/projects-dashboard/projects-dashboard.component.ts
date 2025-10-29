import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-projects-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects-dashboard.component.html',
  styleUrl: './projects-dashboard.component.css'
})
export class ProjectsDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  projectId = signal<string>('');
  loading = signal(false);

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.projectId.set(id);
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.loading.set(true);
    // TODO: Cargar datos del dashboard
    console.log('[DASHBOARD] Loading data for project:', this.projectId());
    this.loading.set(false);
  }
}
