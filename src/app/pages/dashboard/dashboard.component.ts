import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>
      
      <!-- Role-specific welcome message -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold mb-2 dark:text-white">
          Welcome, {{userRole}} User
        </h2>
        <p class="text-gray-600 dark:text-gray-300">
          This is your personalized dashboard. Access your features from the sidebar or the quick links below.
        </p>
      </div>
      
      <!-- Quick access cards - shown based on role -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Admin cards -->
        <div *ngIf="isAdmin" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">System Management</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Manage system settings and user permissions.</p>
          <a routerLink="/dashboard/admin" class="text-blue-600 dark:text-blue-400 hover:underline">Access Admin Panel →</a>
        </div>
        
        <!-- Partner cards -->
        <div *ngIf="isPartner" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">Projects</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Manage your projects and teams.</p>
          <a routerLink="/dashboard/project" class="text-blue-600 dark:text-blue-400 hover:underline">View Projects →</a>
        </div>
        
        <div *ngIf="isPartner" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">Staff</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Manage your staff and team members.</p>
          <a routerLink="/dashboard/staff" class="text-blue-600 dark:text-blue-400 hover:underline">View Staff →</a>
        </div>
        
        <!-- Tester cards -->
        <div *ngIf="isTester" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">Issues</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Track and manage testing issues.</p>
          <a routerLink="/dashboard/issues" class="text-blue-600 dark:text-blue-400 hover:underline">View Issues →</a>
        </div>
        
        <!-- Chef cards -->
        <div *ngIf="isChef" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">Project Management</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Oversee project development and team coordination.</p>
          <a routerLink="/dashboard/project-management" class="text-blue-600 dark:text-blue-400 hover:underline">Manage Projects →</a>
        </div>
        
        <!-- Developer cards -->
        <div *ngIf="isDeveloper" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">Development Tasks</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">View and manage your development tasks.</p>
          <a routerLink="/dashboard/tasks" class="text-blue-600 dark:text-blue-400 hover:underline">View Tasks →</a>
        </div>
        
        <!-- Technical team cards -->
        <div *ngIf="isTechnicalTeam" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">Technical Resources</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Access shared technical resources and documentation.</p>
          <a routerLink="/dashboard/technical-resources" class="text-blue-600 dark:text-blue-400 hover:underline">View Resources →</a>
        </div>
        
        <!-- Common cards for all users -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-3 dark:text-white">My Profile</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">View and edit your profile information.</p>
          <a routerLink="/dashboard/profile" class="text-blue-600 dark:text-blue-400 hover:underline">View Profile →</a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  userRole: string = '';
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || 'User';
  }
  
  // Role-based getters for template
  get isAdmin(): boolean {
    return this.userRole === Role.ADMIN;
  }
  
  get isPartner(): boolean {
    return this.userRole === Role.PARTNER;
  }
  
  get isTester(): boolean {
    return this.userRole === Role.TESTER;
  }
  
  get isChef(): boolean {
    return this.userRole === Role.CHEF;
  }
  
  get isDeveloper(): boolean {
    return this.userRole === Role.DEVELOPER;
  }
  
  get isTechnicalTeam(): boolean {
    return this.userRole === Role.DEVELOPER || 
           this.userRole === Role.TESTER || 
           this.userRole === Role.CHEF;
  }
} 