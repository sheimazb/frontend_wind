import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  userRole: string | null = null;

  // Définir les routes de manière centralisée
  private readonly routes = {
    dashboard: '/dashboard/project',
    staff: '/dashboard/staff',
    stats: '/dashboard/stats',
    alert: '/dashboard/alert',
    issues: '/dashboardTesteur/issues'
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;
  }

  get activeMenu(): string {
    const url = this.router.url;
    const menuMapping: { [key: string]: string } = {
      'project': 'dashboard',
      'staff': 'staff',
      'stats': 'stats',
      'alert': 'alert',
      'issues': 'issues',
    };
  
    return Object.keys(menuMapping).find(key => url.includes(key)) || 'dashboard';
  }

  // Helper methods to check role-based visibility
  get isPartner(): boolean {
    return this.userRole === 'PARTNER';
  }

  get isTester(): boolean {
    return this.userRole === 'TESTER';
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
    this.router.navigate([this.routes.alert]);
  }

  onIssuesClick() {
    this.router.navigate([this.routes.issues]);
  }
}