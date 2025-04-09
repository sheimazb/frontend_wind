import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
   letsFolderOpen,
   letsUser, 
   letsStat,
   letsArhivesAlt,
   lets3dBox,
   letsFileDock,
  letsTicket,
  letsBoxes,
  letsTicketAlt
 } from '@ng-icons/lets-icons/regular';
import { letsHomeDuotone } from '@ng-icons/lets-icons/duotone';
import { saxNotificationBingOutline } from '@ng-icons/iconsax/outline';
import { saxLogoutBulk } from '@ng-icons/iconsax/bulk';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role.enum';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, NgIcon],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  viewProviders: [provideIcons({
    letsFolderOpen, letsUser, letsStat, letsHomeDuotone, letsArhivesAlt,lets3dBox,letsFileDock,
    saxNotificationBingOutline, saxLogoutBulk,letsTicket,letsBoxes,letsTicketAlt
  })]
})
export class SidebarComponent implements OnInit, OnDestroy {
  userRole: Role | null = null;
  isSidebarVisible = false;
  activeMenu = '';
  private sidebarSubscription: Subscription | null = null;

  // Define routes for different sections
  routes = {
    dashboard: '/dashboard',
    project: '/dashboard/project',
    staff: '/dashboard/staff',
    stats: '/dashboard/stats',
    alert: '/dashboard/alert',
    issues: '/dashboard/issues',
    agencies: '/dashboard/agencies',
    profile: '/dashboard/profile',
    projectManagement: '/dashboard/project-management',
    tasks: '/dashboard/tasks',
    technicalResources: '/dashboard/technical-resources',
    admin: '/dashboard/admin',
    ticketList: '/dashboard/ticket-list',
    kanban: '/dashboard/kanban'
  };

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private authService: AuthService
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
    this.userRole = currentUser?.role as Role || null;

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
    
    // Set active menu based on current route
    this.setActiveMenuFromUrl(this.router.url);
    
    // Subscribe to route changes to update active menu
    this.router.events.subscribe(() => {
      this.setActiveMenuFromUrl(this.router.url);
    });
  }

  ngOnDestroy() {
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
  
  private setActiveMenuFromUrl(url: string) {
    if (url.includes('/admin')) {
      this.activeMenu = 'admin';
    } else if (url.includes('/agencies')) {
      this.activeMenu = 'admin';
    } else if (url.includes('/project-management')) {
      this.activeMenu = 'project-management';
    } else if (url.includes('/tasks')) {
      this.activeMenu = 'tasks';
    } else if (url.includes('/technical-resources')) {
      this.activeMenu = 'technical-resources';
    } else if (url.includes('/project')) {
      this.activeMenu = 'project';
    } else if (url.includes('/staff')) {
      this.activeMenu = 'staff';
    } else if (url.includes('/stats')) {
      this.activeMenu = 'stats';
    } else if (url.includes('/alert')) {
      this.activeMenu = 'alert';
    } else if (url.includes('/issues')) {
      this.activeMenu = 'issues';
    } else if (url.includes('/kanban')) {
      this.activeMenu = 'kanban';
    } else if (url.includes('/ticket-list')) {
      this.activeMenu = 'ticket-list';
    } else if (url === '/dashboard') {
      this.activeMenu = 'dashboard';
    }
  }

  // Helper methods to check role-based visibility
  get isAdmin(): boolean {
    return this.userRole === Role.ADMIN;
  }

  get isPartner(): boolean {
    return this.userRole === Role.PARTNER;
  }

  get isTester(): boolean {
    return this.userRole === Role.TESTER;
  }
  
  get isManager(): boolean {
    return this.userRole === Role.MANAGER;
  }
  
  get isDeveloper(): boolean {
    return this.userRole === Role.DEVELOPER;
  }
  
  get isTechnicalTeam(): boolean {
    return this.userRole === Role.DEVELOPER || 
           this.userRole === Role.TESTER || 
           this.userRole === Role.MANAGER;
  }

  // Navigation methods
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeSidebarOnMobile();
  }

  onDashboardClick() {
    this.router.navigate([this.routes.project]);
    this.closeSidebarOnMobile();
  }

  onStaffClick() {
    this.router.navigate([this.routes.staff]);
    this.closeSidebarOnMobile();
  }

  onStatsClick() {
    this.router.navigate([this.routes.stats]);
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
  
  onProjectManagementClick() {
    this.router.navigate([this.routes.projectManagement]);
    this.closeSidebarOnMobile();
  }
  
  onTasksClick() {
    this.router.navigate([this.routes.tasks]);
    this.closeSidebarOnMobile();
  }
  
  onTechnicalResourcesClick() {
    this.router.navigate([this.routes.technicalResources]);
    this.closeSidebarOnMobile();
  }
  
  onTicketsClick() {
    this.router.navigate([this.routes.ticketList]);
    this.closeSidebarOnMobile();
  }
  
  onKanbanClick() {
    // Use router.navigateByUrl to force route refresh
    this.router.navigateByUrl(this.routes.kanban);
    this.closeSidebarOnMobile();
  }
  
  onAdminClick() {
    this.router.navigate([this.routes.admin]);
    this.closeSidebarOnMobile();
  }
  
  onHomeClick() {
    this.router.navigate([this.routes.dashboard]);
    this.closeSidebarOnMobile();
  }
  
  onLogoutClick() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Close sidebar after navigation on mobile devices
  public closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
      this.sidebarService.toggleSidebar();
    }
  }
}