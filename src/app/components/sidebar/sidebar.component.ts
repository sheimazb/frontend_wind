import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  userRole: string | null = null;
  isSidebarVisible: boolean = false;
  private sidebarSubscription: Subscription | null = null;

  // Définir les routes de manière centralisée
  private readonly routes = {
    dashboard: '/dashboard/project',
    staff: '/dashboard/staff',
    stats: '/dashboard/stats',
    alert: '/dashboard/alert',
    issues: '/dashboardTesteur/issues',
    agencies:'/dashboardAdmin'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    // Update sidebar visibility on window resize
    const isLargeScreen = window.innerWidth >= 1024;
    
    // On large screens, always show sidebar
    if (isLargeScreen) {
      this.isSidebarVisible = true;
    }
    
    this.updateSidebarVisibility();
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;

    // Subscribe to sidebar visibility changes
    this.sidebarSubscription = this.sidebarService.sidebarVisibility$.subscribe(
      isVisible => {
        this.isSidebarVisible = isVisible;
        this.updateSidebarVisibility();
      }
    );

    // Initialize sidebar visibility based on screen size
    this.isSidebarVisible = window.innerWidth >= 1024; // 1024px is the lg breakpoint in Tailwind
    this.updateSidebarVisibility();
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  private updateSidebarVisibility() {
    const sidebarElement = document.getElementById('sidebar');
    const backdropElement = document.getElementById('sidebarBackdrop');
    
    if (sidebarElement) {
      if (this.isSidebarVisible) {
        sidebarElement.classList.remove('hidden');
      } else {
        // Only hide on mobile
        if (window.innerWidth < 1024) {
          sidebarElement.classList.add('hidden');
        }
      }
    }

    // Show/hide backdrop when sidebar is visible/hidden on mobile
    if (backdropElement) {
      if (this.isSidebarVisible && window.innerWidth < 1024) {
        backdropElement.classList.remove('hidden');
      } else {
        backdropElement.classList.add('hidden');
      }
    }
  }

  
  get activeMenu(): string {
    const url = this.router.url;
    const menuMapping: { [key: string]: string } = {
      'project': 'dashboard',
      'staff': 'staff',
      'stats': 'stats',
      'alert': 'alert',
      'issues': 'issues',
      'agencies':'agencies'
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
  get isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  onStatsClick() {
    this.router.navigate([this.routes.stats]);
    this.closeSidebarOnMobile();
  }

  onDashboardClick() {
    this.router.navigate([this.routes.dashboard]);
    this.closeSidebarOnMobile();
  }

  onStaffClick() {
    this.router.navigate([this.routes.staff]);
    this.closeSidebarOnMobile();
  }

  onAlertClick() {
    this.router.navigate([this.routes.alert]);
    this.closeSidebarOnMobile();
  }

  onIssuesClick() {
    this.router.navigate([this.routes.issues]);
    this.closeSidebarOnMobile();
  }
  onAgenciesClick() {
    this.router.navigate([this.routes.agencies]);
    this.closeSidebarOnMobile();
  }

  // Close sidebar after navigation on mobile devices
  public closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
      this.sidebarService.toggleSidebar();
    }
  }
}