import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import ApexCharts from 'apexcharts';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role.enum';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService } from '../../services/project.service';
import { Project as ProjectModel } from '../../models/project.model';
import { map } from 'rxjs/operators';
import { StatsService } from '../../services/stats.service';
import { StaffService } from '../../services/staff.service';

// Interface for developer statistics
interface DeveloperStatistics {
  errorsResolved: number;
  ticketsResolvedThisWeek: number;
  totalSolutions: number;
  assignedTickets: number;
  recentSolutions: Array<{
    id: number;
    title: string;
    complexity: string;
    content: string;
    authorUserId: number;
    status: string;
    estimatedTime: number;
    costEstimation: number;
    category: string;
    tenant: string;
    ticket: {
      id: number;
      title: string;
      description: string;
      status: string;
      attachments: any[];
      priority: string;
      assignedToUserId: number;
      tenant: string;
      creatorUserId: number;
      userEmail: string;
      log: any;
    };
  }>;
}

// Interface for admin statistics
interface AdminStatistics {
  usersByRole: {
    TESTER: number;
    ADMIN: number;
    DEVELOPER: number;
    PARTNER: number;
    MANAGER: number;
  };
  totalUsers: number;
  activePartners: number;
  lockedAccounts: number;
  activatedUsers: number;
  numberOfTenants: number;
  totalPartners: number;
  lockedPartners: number;
}

// Interface for dashboard statistics
interface DashboardStatistics {
  newTicketsThisWeek: number;
  resolvedTicketsThisWeek: number;
  errorsByDay: Array<{ date: string; count: number }>;
  openTickets: number;
  criticalErrors: number;
  totalTickets: number;
  teamActivity: Array<{ date: string; count: number }>;
  doneTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

// Interface for project log statistics
interface ProjectLogStatistics {
  activityByDay: Array<{
    day: string;
    count: number;
  }>;
  errorsByDay: Array<{
    day: string;
    type: string;
    count: number;
  }>;
  timeBasedStatistics: {
    totalErrors: number;
  };
  criticalErrors: number;
  totalErrors: number;
  errorsByType: Array<{
    count: number;
    type: string;
  }>;
}

// Interface for project selection
interface Project {
  id: number;
  name: string;
}

// Interface for developer ticket counts
interface DeveloperTicketCounts {
  id: number;
  name: string;
  email: string;
  todoTickets: number;
  totalAssignedTickets: number;
  doneTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
}

interface StaffMember {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  role?: string;
  isCurrentUser?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  template: `
    <div class="min-h-screen p-4 sm:p-6 lg:p-8">
      <div class="max-w-7xl mx-auto space-y-8">
        <!-- Header Section -->
        <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome, {{userRole}} User  
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                Monitor your dashboard and activities
              </p>
            </div>
            
            <!-- Project Selection -->
            <div *ngIf="!isAdmin" class="flex-shrink-0 flex flex-row">
           <p>Select a project</p>
              <select 
                [value]="selectedProjectId"
                (change)="onProjectChange($event)"
                class="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option *ngFor="let project of projects" [value]="project.id">
                  {{project.name}}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Admin Statistics Section -->
        <div *ngIf="isAdmin && adminStats && !isLoading" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <!-- Total Partners Card -->
          <div class="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-blue-100 text-sm font-medium mb-2">Total Partners</p>
                <p class="text-3xl font-bold mb-1">{{adminStats.totalPartners}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">All registered partners</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">groups</mat-icon>
              </div>
            </div>
          </div>

          <!-- Active Partners Card -->
          <div class="group bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-green-100 text-sm font-medium mb-2">Active Partners</p>
                <p class="text-3xl font-bold mb-1">{{adminStats.activePartners}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">Currently active partners</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">check_circle</mat-icon>
              </div>
            </div>
          </div>

          <!-- Locked Partners Card -->
          <div class="group bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-red-100 text-sm font-medium mb-2">Locked Partners</p>
                <p class="text-3xl font-bold mb-1">{{adminStats.lockedPartners}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">Partners with locked accounts</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">lock</mat-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Partner Statistics Chart -->
        <div *ngIf="isAdmin && adminStats && !isLoading" class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Partner Statistics</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Overview of partner accounts</p>
            </div>
          </div>
          <div #partnerStatsChart class="h-80"></div>
        </div>

        <!-- Project Statistics Section -->
        <div *ngIf="projectLogStats && !isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Errors Card -->
          <div class="group bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-red-100 text-sm font-medium mb-2">Total Errors</p>
                <p class="text-3xl font-bold mb-1">{{projectLogStats.totalErrors}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">All project errors</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">error_outline</mat-icon>
              </div>
            </div>
          </div>

          <!-- Critical Errors Card -->
          <div class="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-orange-100 text-sm font-medium mb-2">Critical Errors</p>
                <p class="text-3xl font-bold mb-1">{{projectLogStats.criticalErrors}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">High priority issues</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">warning</mat-icon>
              </div>
            </div>
          </div>

          <!-- Error Types Card -->
          <div class="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-purple-100 text-sm font-medium mb-2">Error Types</p>
                <p class="text-3xl font-bold mb-1">{{projectLogStats.errorsByType.length}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">Distinct error categories</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">category</mat-icon>
              </div>
            </div>
          </div>

          <!-- Time-based Statistics Card -->
          <div class="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-blue-100 text-sm font-medium mb-2">Total Time Errors</p>
                <p class="text-3xl font-bold mb-1">{{projectLogStats.timeBasedStatistics.totalErrors}}</p>
                <div class="flex items-center text-sm">
                  <span class="font-medium">Time-based analysis</span>
                </div>
              </div>
              <div class="bg-white/20 rounded-full p-3 group-hover:bg-white/30 transition-colors duration-300">
                <mat-icon class="text-2xl">schedule</mat-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Project Charts Section -->
        <div *ngIf="projectLogStats && !isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Project Errors Chart -->
          <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Error Distribution</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily error count</p>
              </div>
            </div>
            <div #projectErrorsChart class="h-80"></div>
          </div>

          <!-- Project Activity Chart -->
          <div class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Project Activity</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily activity trends</p>
              </div>
            </div>
            <div #projectActivityChart class="h-80"></div>
          </div>
        </div>

        <!-- Developer Ticket Statistics Section -->
        <div *ngIf="(isManager) && !isLoading" 
             class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Developer Ticket Statistics</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Overview of ticket distribution among developers</p>
            </div>
          </div>
          
          <!-- Loading State -->
          <div *ngIf="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- No Data State -->
          <div *ngIf="!isLoading && developerTicketCounts.length === 0" class="text-center py-12">
            <div class="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <mat-icon class="text-gray-500 dark:text-gray-400" style="width: 32px; height: 32px; font-size: 32px;">people_outline</mat-icon>
            </div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No Developers Found</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">There are no developers assigned to this project.</p>
          </div>
          
          <!-- Data Table -->
          <div *ngIf="!isLoading && developerTicketCounts.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Developer</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Todo</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">In Progress</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Done</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resolved</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
                <tr *ngFor="let dev of developerTicketCounts" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span class="text-indigo-700 dark:text-indigo-300 font-medium text-sm">
                          {{getInitials(dev.name)}}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">{{dev.name}}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">{{dev.email}}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                      {{dev.todoTickets}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {{dev.inProgressTickets}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {{dev.doneTickets}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {{dev.resolvedTickets}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {{dev.totalAssignedTickets}}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Quick Access Cards -->
        <div *ngIf="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Admin cards -->
          <div *ngIf="isAdmin" class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">System Management</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Manage system settings and user permissions.</p>
            <a routerLink="/dashboard/admin" class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
              Access Admin Panel
              <mat-icon class="ml-1">arrow_forward</mat-icon>
            </a>
          </div>
          
          <!-- Partner cards -->
          <div *ngIf="isPartner" class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Projects</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Manage your projects and teams.</p>
            <a routerLink="/dashboard/project" class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
              View Projects
              <mat-icon class="ml-1">arrow_forward</mat-icon>
            </a>
          </div>
          
          <!-- Developer cards -->
          <div *ngIf="isDeveloper" class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Development Tasks</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4">View and manage your development tasks.</p>
            <a routerLink="/dashboard/tasks" class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
              View Tasks
              <mat-icon class="ml-1">arrow_forward</mat-icon>
            </a>
          </div>
          
        </div>
      </div>
    </div>

    <style>
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
    </style>
  `,
  styles: []
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ticketStatusChart', { static: false }) ticketStatusChartRef!: ElementRef;
  @ViewChild('teamActivityChart', { static: false }) teamActivityChartRef!: ElementRef;
  @ViewChild('projectErrorsChart', { static: false }) projectErrorsChartRef!: ElementRef;
  @ViewChild('projectActivityChart', { static: false }) projectActivityChartRef!: ElementRef;
  @ViewChild('partnerStatsChart', { static: false }) partnerStatsChartRef!: ElementRef;

  userRole: string = '';
  dashboardStats: DashboardStatistics | null = null;
  developerStats: DeveloperStatistics | null = null;
  projectLogStats: ProjectLogStatistics | null = null;
  adminStats: AdminStatistics | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  selectedProjectId: number | null = null;
  projects: ProjectModel[] = [];
  
  // Chart instances
  private ticketStatusChart: ApexCharts | null = null;
  private teamActivityChart: ApexCharts | null = null;
  private projectErrorsChart: ApexCharts | null = null;
  private projectActivityChart: ApexCharts | null = null;
  private partnerStatsChart: ApexCharts | null = null;
  
  developerTicketCounts: DeveloperTicketCounts[] = [];
  staffMembers: StaffMember[] = [];
  currentUserId: string | null = null;
  
  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private projectService: ProjectService,
    private statsService: StatsService,
    private staffService: StaffService
  ) {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserId = JSON.parse(user).id;
    }
  }
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'User not authenticated';
      return;
    }

    // Get user data from localStorage to access all properties
    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : {};
    
    this.userRole = currentUser.role || 'User';
    const userId = userData.id;

    if (!userId) {
      this.error = 'User ID not found';
      return;
    }

    // Load admin statistics if user is admin
    if (this.isAdmin) {
      this.loadAdminStatistics();
    }

    // Load user's projects
    this.isLoading = true;
    this.projectService.getUserProjects(userId).subscribe({
      next: (projects) => {
        console.log('User projects loaded:', projects);
        this.projects = projects;
        
        if (this.projects && this.projects.length > 0) {
          const firstProject = this.projects[0];
          if (firstProject && firstProject.id) {
            this.selectedProjectId = firstProject.id;
            this.loadProjectLogStatistics(this.selectedProjectId);
            // Load developers for the first project if user is admin or manager
            if (this.isAdmin || this.isManager) {
              this.loadProjectDevelopers(this.selectedProjectId);
            }
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user projects:', error);
        this.error = 'Failed to load your projects';
        this.isLoading = false;
      }
    });

    // Load developer ticket counts if user is admin or manager
    if (this.isAdmin || this.isManager) {
      if (this.selectedProjectId) {
        this.loadProjectDevelopers(this.selectedProjectId);
      }
    }
  }

  onProjectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const projectId = Number(select.value);
    if (!isNaN(projectId)) {
      console.log('Selected project ID:', projectId);
      this.selectedProjectId = projectId;
      this.loadProjectLogStatistics(projectId);
      // Clear previous developer data
      this.developerTicketCounts = [];
      // Load project members and their statistics
      if (this.isAdmin || this.isManager) {
        this.loadProjectDevelopers(projectId);
      }
    }
  }

  public reloadProjects(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userId = JSON.parse(userData).id;
      if (userId) {
        this.loadUserProjects(userId);
      }
    }
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }
  
  public loadDashboardStatistics(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<DashboardStatistics>('http://localhost:8222/api/v1/statistics/dashboard')
      .subscribe({
        next: (data) => {
          this.dashboardStats = data;
          this.isLoading = false;
          this.initializeCharts();
        },
        error: (error) => {
          console.error('Error loading dashboard statistics:', error);
          this.error = 'Failed to load dashboard statistics. Please try again.';
          this.isLoading = false;
        }
      });
  }

  public loadProjectLogStatistics(projectId: number): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<ProjectLogStatistics>(`http://localhost:8222/api/v1/statistics/logs/project/${projectId}/details`)
      .subscribe({
        next: (data) => {
          this.projectLogStats = data;
          this.isLoading = false;
          this.initializeProjectCharts();
        },
        error: (error) => {
          console.error('Error loading project log statistics:', error);
          this.error = 'Failed to load project log statistics. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private initializeCharts(): void {
    if (!this.dashboardStats) return;

    setTimeout(() => {
      this.initTicketStatusChart();
      this.initTeamActivityChart();
    }, 100);
  }

  private initTicketStatusChart(): void {
    if (!this.ticketStatusChartRef || !this.dashboardStats) return;

    // Destroy existing chart if it exists
    if (this.ticketStatusChart) {
      this.ticketStatusChart.destroy();
    }

    const chartData = [
      this.dashboardStats.openTickets,
      this.dashboardStats.inProgressTickets,
      this.dashboardStats.doneTickets,
      this.dashboardStats.resolvedTickets
    ];

    // Only show chart if there's data
    if (chartData.every(value => value === 0)) {
      this.ticketStatusChartRef.nativeElement.innerHTML = 
        '<div class="flex items-center justify-center h-full text-gray-500">No ticket data available</div>';
      return;
    }

    const options = {
      series: chartData,
      chart: {
        type: 'donut' as const,
        height: 320,
        background: 'transparent'
      },
      labels: ['Open', 'In Progress', 'Done', 'Resolved'],
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
      legend: {
        position: 'bottom' as const,
        labels: {
          colors: ['#374151']
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff']
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%'
          }
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 280
          },
          legend: {
            position: 'bottom' as const
          }
        }
      }]
    };

    this.ticketStatusChart = new ApexCharts(this.ticketStatusChartRef.nativeElement, options);
    this.ticketStatusChart.render();
  }
  private initTeamActivityChart(): void {
    if (!this.teamActivityChartRef || !this.dashboardStats) return;

    // Destroy existing chart if it exists
    if (this.teamActivityChart) {
      this.teamActivityChart.destroy();
    }

    // Sort team activity by date
    const sortedActivity = [...this.dashboardStats.teamActivity].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const options = {
      series: [{
        name: 'Activity',
        data: sortedActivity.map(item => item.count)
      }],
      chart: {
        type: 'area' as const,
        height: 320,
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: sortedActivity.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        labels: {
          style: {
            colors: '#6b7280'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#6b7280']
          }
        }
      },
      colors: ['#3b82f6'],
      stroke: {
        curve: 'smooth' as const,
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      markers: {
        size: 5,
        colors: ['#3b82f6'],
        strokeColors: '#fff',
        strokeWidth: 2
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 5
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 280
          }
        }
      }]
    };

    this.teamActivityChart = new ApexCharts(this.teamActivityChartRef.nativeElement, options);
    this.teamActivityChart.render();
  }

  private initializeProjectCharts(): void {
    if (!this.projectLogStats) return;

    setTimeout(() => {
      this.initProjectErrorsChart();
      this.initProjectActivityChart();
    }, 100);
  }

  private initProjectErrorsChart(): void {
    if (!this.projectErrorsChartRef || !this.projectLogStats) return;

    // Destroy existing chart if it exists
    if (this.projectErrorsChart) {
      this.projectErrorsChart.destroy();
    }

    const sortedErrors = [...this.projectLogStats.errorsByDay].sort((a, b) => 
      new Date(a.day).getTime() - new Date(b.day).getTime()
    );

    const options = {
      series: [{
        name: 'Errors',
        data: sortedErrors.map(item => item.count)
      }],
      chart: {
        type: 'bar' as const,
        height: 320,
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: sortedErrors.map(item => {
          const date = new Date(item.day);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        labels: {
          style: {
            colors: '#6b7280'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#6b7280']
          }
        }
      },
      colors: ['#ef4444'],
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '60%'
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 5
      }
    };

    this.projectErrorsChart = new ApexCharts(this.projectErrorsChartRef.nativeElement, options);
    this.projectErrorsChart.render();
  }

  private initProjectActivityChart(): void {
    if (!this.projectActivityChartRef || !this.projectLogStats) return;

    // Destroy existing chart if it exists
    if (this.projectActivityChart) {
      this.projectActivityChart.destroy();
    }

    const sortedActivity = [...this.projectLogStats.activityByDay].sort((a, b) => 
      new Date(a.day).getTime() - new Date(b.day).getTime()
    );

    const options = {
      series: [{
        name: 'Activity',
        data: sortedActivity.map(item => item.count)
      }],
      chart: {
        type: 'area' as const,
        height: 320,
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: sortedActivity.map(item => {
          const date = new Date(item.day);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        labels: {
          style: {
            colors: '#6b7280'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#6b7280']
          }
        }
      },
      colors: ['#10b981'],
      stroke: {
        curve: 'smooth' as const,
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 5
      }
    };

    this.projectActivityChart = new ApexCharts(this.projectActivityChartRef.nativeElement, options);
    this.projectActivityChart.render();
  }

  ngOnDestroy(): void {
    if (this.ticketStatusChart) {
      this.ticketStatusChart.destroy();
    }
    if (this.teamActivityChart) {
      this.teamActivityChart.destroy();
    }
    if (this.projectErrorsChart) {
      this.projectErrorsChart.destroy();
    }
    if (this.projectActivityChart) {
      this.projectActivityChart.destroy();
    }
    if (this.partnerStatsChart) {
      this.partnerStatsChart.destroy();
    }
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

  private loadUserProjects(userId: number): void {
    this.isLoading = true;
    this.error = null;
    
    this.projectService.getUserProjects(userId).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.isLoading = false;
        
        if (this.projects && this.projects.length > 0) {
          const firstProject = this.projects[0];
          if (firstProject && firstProject.id) {
            this.selectedProjectId = firstProject.id;
            this.loadProjectLogStatistics(this.selectedProjectId);
          }
        }
      },
      error: (error) => {
        console.error('Error loading user projects:', error);
        this.error = 'Failed to load your projects';
        this.isLoading = false;
      }
    });
  }

  private loadProjectDevelopers(projectId: number): void {
    this.isLoading = true;
    this.projectService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        // Filter for developers only
        const developers = members.filter(member => member.role === 'DEVELOPER');
        
        // Clear previous data
        this.developerTicketCounts = [];
        
        // Map each developer to the display format
        developers.forEach(dev => {
          this.developerTicketCounts.push({
            id: dev.id || 0,
            name: dev.firstname && dev.lastname 
              ? `${dev.firstname} ${dev.lastname}`
              : dev.email.split('@')[0],
            email: dev.email,
            todoTickets: 0,
            totalAssignedTickets: 0,
            doneTickets: 0,
            inProgressTickets: 0,
            resolvedTickets: 0
          });
          
          // Get ticket counts for this developer
          if (dev.id) {
            this.loadTicketCountsForDeveloper(dev.id);
          }
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading project developers:', error);
        this.isLoading = false;
      }
    });
  }

  private loadTicketCountsForDeveloper(developerId: number): void {
    this.http.get<any>(`http://localhost:8222/api/v1/statistics/tickets-count/developer/${developerId}`).subscribe({
      next: (stats) => {
        // Find and update the developer's ticket counts
        const developerIndex = this.developerTicketCounts.findIndex(d => d.id === developerId);
        if (developerIndex !== -1) {
          this.developerTicketCounts[developerIndex] = {
            ...this.developerTicketCounts[developerIndex],
            todoTickets: stats.todoTickets || 0,
            totalAssignedTickets: stats.totalAssignedTickets || 0,
            doneTickets: stats.doneTickets || 0,
            inProgressTickets: stats.inProgressTickets || 0,
            resolvedTickets: stats.resolvedTickets || 0
          };
        }
      },
      error: (error) => {
        console.error(`Error loading ticket counts for developer ${developerId}:`, error);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  public loadAdminStatistics(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<AdminStatistics>('http://localhost:8222/api/v1/auth/stats')
      .subscribe({
        next: (data) => {
          this.adminStats = data;
          this.isLoading = false;
          setTimeout(() => {
            this.initPartnerStatsChart();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading admin statistics:', error);
          this.error = 'Failed to load admin statistics. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private initPartnerStatsChart(): void {
    if (!this.partnerStatsChartRef || !this.adminStats) return;

    // Destroy existing chart if it exists
    if (this.partnerStatsChart) {
      this.partnerStatsChart.destroy();
    }

    const options = {
      series: [{
        name: 'Partners',
        data: [
          this.adminStats.totalPartners,
          this.adminStats.activePartners,
          this.adminStats.lockedPartners
        ]
      }],
      chart: {
        type: 'bar' as const,
        height: 320,
        background: 'transparent',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        categories: ['Total Partners', 'Active Partners', 'Locked Partners'],
        labels: {
          style: {
            colors: '#6b7280'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#6b7280']
          }
        }
      },
      colors: ['#6366f1', '#10b981', '#ef4444'],
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '60%',
          distributed: true
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff']
        }
      },
      legend: {
        show: false
      },
      grid: {
        borderColor: '#e5e7eb',
        strokeDashArray: 5
      }
    };

    this.partnerStatsChart = new ApexCharts(this.partnerStatsChartRef.nativeElement, options);
    this.partnerStatsChart.render();
  }
}