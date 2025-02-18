import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  // Définir les routes de manière centralisée
  private readonly routes = {
    dashboard: '/dashboard/project',
    staff: '/dashboard/staff',
    stats: '/dashboard/stats',
    alert: '/dashboard/alert',
    issues:'/dashboardTesteur/issues'  // Changed from 'alerte' to 'alert' to match mapping
  };

  constructor(private router: Router) {}

  get activeMenu(): string {
    const url = this.router.url;
    // Simplifier le mapping en utilisant les mêmes clés
    const menuMapping: { [key: string]: string } = {
      'project': 'dashboard',
      'staff': 'staff',
      'stats': 'stats',
      'alert': 'alert',
      'issues':'issues',
    };
  
    return Object.keys(menuMapping).find(key => url.includes(key)) || 'dashboard';
  }

  onStatsClick() {
    this.router.navigate([this.routes.stats]);
  }

  onDashboardClick() {
    this.router.navigate([this.routes.dashboard]);
  }

  onStaffClick() {
    this.router.navigate([this.routes.staff]);
  }

  onAlertClick() {
    this.router.navigate([this.routes.alert]);  // Using the centralized route
  }
  onIssuesClick() {
    this.router.navigate([this.routes.issues]);  
  }
}