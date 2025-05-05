import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { diAngularOriginal } from '@ng-icons/devicon/original';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Router, RouterModule } from '@angular/router';
import { LogService } from '../../../../services/log.service';
import { letsAddSquare, letsView } from '@ng-icons/lets-icons/regular';
import { FormsModule } from '@angular/forms';

import { Log, LogSeverity } from '../../../../models/log.model';
import { UserService } from '../../../../services/user.service';
import { ProjectService } from '../../../../services/project.service';
import { Project } from '../../../../models/project.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../../../services/auth.service';
import { Role } from '../../../../models/role.enum';
import { TicketService } from '../../../../services/ticket.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { User } from '../../../../models/user.model';
@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatCheckboxModule,
    NgIcon,
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './issues.component.html',
  styleUrl: './issues.component.css',
  viewProviders: [provideIcons({ diAngularOriginal, letsAddSquare, letsView })],
})
export class IssuesComponent implements OnInit {
  constructor(
    private router: Router,
    private logService: LogService,
    private userService: UserService,
    private projectService: ProjectService,
    private ticketService: TicketService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  // Data properties
  logs: Log[] = [];
  projects: Project[] = [];
  selectedProjectId: string = '';
  tenant: string = '';
  userId: number = 0;
  userRole: string = '';
  
  // UI state properties
  loading: boolean = false;
  selectedView: 'projects' | 'logs' = 'projects';
  logsByProjectId: Log[] = [];
  filteredLogs: Log[] = [];
  priorityFilter: string = '';

  // New properties
  projectLogsCache: Record<string, Log[]> = {};
  isDeveloper: boolean = false;
  // Cache to store which logs have tickets assigned to the current user
  assignableLogIds = new Set<string>();
    
   
  ngOnInit(): void {
    this.loadUserData();
  }
  getIsTester(): boolean {
    return this.userRole === Role.TESTER;
  }
 

  loadUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Get user data from localStorage directly to access all properties
      const storedUser = localStorage.getItem('user');
      const userData = storedUser ? JSON.parse(storedUser) : {};
      
      this.tenant = userData.tenant || '';
      this.userId = parseInt(userData.id?.toString() || '0', 10);
      this.userRole = currentUser.role || '';
      this.isDeveloper = this.userRole === Role.DEVELOPER;
      
      if (this.userId) {
        // Load projects first
        this.loadUserProjects();
        
        // Then load logs directly - we'll handle developer permissions when filtering
        this.loadLogs();
      } else {
        this.showNotification('User ID not found', 'error');
      }
    } else {
      this.showNotification('User information not found', 'error');
    }
  }
 
  loadUserProjects() {
    this.loading = true;
    
    // Use getUserProjects for all roles - this endpoint is role-aware and will return
    // the appropriate projects based on the user's role
    this.projectService.getUserProjects(this.userId).subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading = false;
        this.showNotification('Failed to load projects', 'error');
      }
    });
  }
  
  loadLogs() {
    this.loading = true;
    console.log('Starting to load logs...');
    
    this.logService.getAllLogs(this.tenant).subscribe({
      next: (logs) => {
        console.log('Raw logs received:', logs);
        
        if (!logs || logs.length === 0) {
          console.warn('No logs were returned from the service');
          this.logs = [];
          this.loading = false;
          return;
        }
        
        // Ensure all logs have proper severity values
        this.logs = logs.map(log => {
          // Normalize severity to uppercase to avoid case sensitivity issues
          if (log.severity) {
            log.severity = log.severity.toString().toUpperCase();
          }
          return log;
        });
        
        this.loading = false;
        
        // Debug logs to understand data
        console.log('Total logs loaded:', this.logs.length);
        
        // Check data integrity
        const missingProjectIds = this.logs.filter(log => !log.projectId).length;
        const missingSeverity = this.logs.filter(log => !log.severity).length;
        
        if (missingProjectIds > 0 || missingSeverity > 0) {
          console.warn('Data integrity issues found:', {
            missingProjectIds,
            missingSeverity
          });
        }
        
        // Log distribution by project
        const projectCounts: Record<string, number> = {};
        this.logs.forEach(log => {
          const projectId = log.projectId?.toString();
          if (projectId) {
            projectCounts[projectId] = (projectCounts[projectId] || 0) + 1;
          }
        });
        console.log('Logs distribution by project:', projectCounts);
        
        // Log distribution by severity
        const priorityCounts: Record<string, number> = {
          'HIGH': 0,
          'MEDIUM': 0,
          'LOW': 0
        };
        this.logs.forEach(log => {
          const severity = log.severity as string;
          if (severity in priorityCounts) {
            priorityCounts[severity]++;
          }
        });
        console.log('Logs distribution by priority:', priorityCounts);
        
        // Force a check of counts for the first project (for debugging)
        if (this.projects.length > 0) {
          const firstProject = this.projects[0];
          console.log('First project counts check:', {
            project: firstProject.name,
            totalIssues: this.getIssueCountForProject(firstProject.id),
            highPriority: this.getIssueCountByPriority(firstProject.id, 'HIGH'),
            mediumPriority: this.getIssueCountByPriority(firstProject.id, 'MEDIUM'),
            lowPriority: this.getIssueCountByPriority(firstProject.id, 'LOW')
          });
        }
        
        // Pre-fetch logs for all projects for accurate counts
        this.preloadAllProjectLogs();
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.loading = false;
        this.showNotification('Failed to load logs', 'error');
      }
    });
  }
  
  loadLogsByProjectId(projectId: string) {
    if (!projectId) return;
    
    this.loading = true;
    console.log(`Loading logs for project ID: ${projectId}`);
    
    this.logService.getLogsByProjectId(projectId).subscribe({
      next: (logs) => {
        console.log(`Received ${logs.length} logs for project ${projectId}`);
        
        // Normalize severity to uppercase for consistency
        this.logsByProjectId = logs.map(log => {
          if (log.severity) {
            log.severity = log.severity.toString().toUpperCase();
          }
          return log;
        });
        
        // Update the cache with these logs
        this.projectLogsCache[projectId] = [...this.logsByProjectId];
        
        // For developers, filter logs to only show those they're assigned to fix
        if (this.isDeveloper) {
          this.filterLogsByDeveloperAssignment();
        } else {
          this.filteredLogs = [...this.logsByProjectId]; // Initialize filtered logs
        }
        
        this.loading = false;
        
        // Log counts to help debug discrepancies
        const totalFromMain = this.getIssueCountForProject(Number(projectId));
        console.log(`Comparing counts - From main logs: ${totalFromMain}, From project-specific: ${this.logsByProjectId.length}`);
        
        // Distribution by priority in this project
        const highCount = this.logsByProjectId.filter(log => log.severity === 'HIGH').length;
        const mediumCount = this.logsByProjectId.filter(log => log.severity === 'MEDIUM').length;
        const lowCount = this.logsByProjectId.filter(log => log.severity === 'LOW').length;
        
        console.log(`Project ${projectId} priority distribution:`, {
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          total: this.logsByProjectId.length
        });
      },
      error: (error) => {
        console.error('Error loading logs by project ID:', error);
        this.loading = false;
        this.showNotification('Failed to load logs for this project', 'error');
      }
    });
  }
  
  // Filter logs to only show those the developer is assigned to
  filterLogsByDeveloperAssignment() {
    if (!this.isDeveloper) {
      this.filteredLogs = [...this.logsByProjectId];
      return;
    }
    
    // Clear the assignable log IDs cache for the new project
    this.assignableLogIds.clear();
    this.loading = true;
    
    // For each log, check if there are tickets assigned to the current user
    // Create an array of promises to fetch ticket data for each log
    const logIds = this.logsByProjectId
      .filter(log => log.id !== undefined)
      .map(log => log.id as number | string);
    
    if (logIds.length === 0) {
      this.filteredLogs = [];
      this.loading = false;
      return;
    }
    
    // Use forkJoin to make multiple API calls in parallel
    const ticketRequests = logIds.map(logId => 
      this.ticketService.getTicketsByLogId(logId).pipe(
        catchError(error => {
          console.error(`Error fetching tickets for log ${logId}:`, error);
          return of([]);
        })
      )
    );
    
    // Process all ticket requests
    forkJoin(ticketRequests).subscribe({
      next: (ticketArrays) => {
        // For each log, check if there are tickets assigned to the current user
        for (let i = 0; i < logIds.length; i++) {
          const logId = logIds[i];
          const tickets = ticketArrays[i];
          
          // Check if any tickets are assigned to the current user
          const isAssignedToCurrentUser = tickets.some(ticket => 
            ticket.assignedToUserId === this.userId
          );
          
          // If assigned, add to the set of accessible logs
          if (isAssignedToCurrentUser) {
            this.assignableLogIds.add(logId.toString());
          }
        }
        
        // Filter logs to only show those with tickets assigned to the current user
        this.filteredLogs = this.logsByProjectId.filter(log => 
          log.id && this.assignableLogIds.has(log.id.toString())
        );
        
        this.loading = false;
        
        // Apply priority filter if needed
        if (this.priorityFilter) {
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Error checking ticket assignments:', error);
        this.showNotification('Error checking ticket assignments', 'error');
        // Default to showing no logs for security
        this.filteredLogs = [];
        this.loading = false;
      }
    });
  }

  onProjectChange(event: any) {
    const projectId = event.target.value;
    this.selectedProjectId = projectId;
    this.loadLogsByProjectId(projectId);
    this.priorityFilter = ''; // Reset filter when changing projects
  }

  selectProject(projectId: number) {
    console.log(`Selecting project with ID: ${projectId}`);
    this.selectedProjectId = projectId.toString();
    
    // Log issue counts for this project (for debugging)
    const totalIssues = this.getIssueCountForProject(projectId);
    const highPriority = this.getIssueCountByPriority(projectId, 'HIGH');
    const mediumPriority = this.getIssueCountByPriority(projectId, 'MEDIUM');
    const lowPriority = this.getIssueCountByPriority(projectId, 'LOW');
    
    console.log(`Project ${projectId} stats:`, {
      totalIssues,
      byPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      }
    });
   
    this.loadLogsByProjectId(this.selectedProjectId);
    this.selectedView = 'logs'; // Switch to logs view after selecting a project
    this.priorityFilter = ''; // Reset filter when selecting a project
  }

  onIssueClick(logId: string | number | undefined) {
    if (!logId) {
      this.router.navigate(['dashboard', 'issues-details']);
      return;
    }
    
    // For developers, check permissions before navigating
    if (this.isDeveloper) {
      // If we have cached permissions, use them
      if (this.assignableLogIds.size > 0) {
        if (!this.assignableLogIds.has(logId.toString())) {
          this.showNotification('You do not have permission to view this issue', 'error');
          return;
        }
      } else {
        // If we don't have cached permissions yet, check directly
        this.loading = true;
        this.ticketService.getTicketsByLogId(logId).subscribe({
          next: (tickets) => {
            this.loading = false;
            const hasAccess = tickets.some(ticket => ticket.assignedToUserId === this.userId);
            if (!hasAccess) {
              this.showNotification('You do not have permission to view this issue', 'error');
              return;
            }
            // If we have access, continue to navigation
            this.router.navigate(['dashboard', 'issues-details', logId]);
          },
          error: (error) => {
            this.loading = false;
            console.error('Error checking permissions:', error);
            this.showNotification('Error checking permissions', 'error');
          }
        });
        return; // Don't navigate yet, wait for permission check
      }
    }
    
    // Navigate to issue details if permission check passes
    this.router.navigate(['dashboard', 'issues-details', logId]);
  }
  
  // Helper methods for project cards
  getIssueCountForProject(projectId: number): number {
    // First try to get count from the cache for accuracy
    const projectIdStr = projectId.toString();
    if (this.projectLogsCache && this.projectLogsCache[projectIdStr]) {
      const cachedLogs = this.projectLogsCache[projectIdStr];
      return cachedLogs.length;
    }
    
    // Fallback to filtering the main logs array
    if (!this.logs || this.logs.length === 0) {
      return 0;
    }
    
    // Count logs that match the project ID
    return this.logs.filter(log => 
      log && log.projectId && log.projectId.toString() === projectId.toString()
    ).length;
  }
  
  // Get count of logs by priority for a project
  getIssueCountByPriority(projectId: number, priority: string): number {
    // First try to get count from the cache for accuracy
    const projectIdStr = projectId.toString();
    const upperPriority = priority.toUpperCase();
    
    if (this.projectLogsCache && this.projectLogsCache[projectIdStr]) {
      const cachedLogs = this.projectLogsCache[projectIdStr];
      return cachedLogs.filter(log => 
        log && log.severity && log.severity.toString().toUpperCase() === upperPriority
      ).length;
    }
    
    // Fallback to filtering the main logs array
    if (!this.logs || this.logs.length === 0) {
      return 0;
    }
    
    // Count logs that match both project ID and priority
    return this.logs.filter(log => 
      log && 
      log.projectId && 
      log.severity && 
      log.projectId.toString() === projectIdStr && 
      log.severity.toString().toUpperCase() === upperPriority
    ).length;
  }
  
  // Calculate percentage for the horizontal bar chart
  getIssuePercentByPriority(projectId: number, priority: string): number {
    const totalCount = this.getIssueCountForProject(projectId);
    if (totalCount === 0) return 0;
    
    const priorityCount = this.getIssueCountByPriority(projectId, priority);
    return Math.round((priorityCount / totalCount) * 100);
  }
  
  // Get project name from ID
  getProjectName(): string {
    if (!this.selectedProjectId) return '';
    const project = this.projects.find(p => p.id.toString() === this.selectedProjectId);
    return project ? project.name : '';
  }
  
  // Update priority of a log
  updatePriority(log: Log) {
    // Check if the user has permission to update this log
    if (this.isDeveloper && !this.canAccessLog(log)) {
      this.showNotification('You do not have permission to modify this issue', 'error');
      return;
    }
    
    const currentPriority = log.severity;
    
    // Create a simple dialog to select priority
    const dialogRef = this.dialog.open(UpdatePriorityDialogComponent, {
      width: '300px',
      data: { priority: currentPriority }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result !== currentPriority) {
        log.severity = result;
        
        // In a real app, you would update this on the server
        // For this example, we'll just update it locally
        this.showNotification(`Priority updated to ${result}`, 'success');
      }
    });
  }
  
  // Apply filters after changing the dropdown
  applyFilters() {
    if (!this.isDeveloper) {
      // Non-developers see all logs with priority filter
      if (!this.priorityFilter) {
        this.filteredLogs = [...this.logsByProjectId];
      } else {
        this.filteredLogs = this.logsByProjectId.filter(log => 
          log.severity === this.priorityFilter
        );
      }
      return;
    }
    
    // For developers, we need to maintain the assignment filter
    // Get the current set of logs the developer can access
    const accessibleLogs = this.logsByProjectId.filter(log => this.canAccessLog(log));
    
    // Then apply the priority filter
    if (!this.priorityFilter) {
      this.filteredLogs = accessibleLogs;
    } else {
      this.filteredLogs = accessibleLogs.filter(log => 
        log.severity === this.priorityFilter
      );
    }
  }
  
  // Check if current user can access this log (for developers)
  canAccessLog(log: Log): boolean {
    if (!this.isDeveloper) {
      return true; // Non-developers can access all logs
    }
    
    // For developers, check if they are assigned to any ticket related to this log
    if (!log.id) {
      return false; // No log ID, can't determine access
    }
    
    // Check if the log ID is in our set of assignable log IDs
    return this.assignableLogIds.has(log.id.toString());
  }
  
  // Refresh logs for the current project
  refreshLogs() {
    if (this.selectedProjectId) {
      this.loadLogsByProjectId(this.selectedProjectId);
      this.showNotification('Issues refreshed', 'success');
    }
  }
  
  showNotification(message: string, type: 'success' | 'error' | 'warning') {
    const panelClass = {
      'success': ['success-snackbar'],
      'error': ['error-snackbar'],
      'warning': ['warning-snackbar']
    }[type];
    
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass
    });
  }
  
  // Helper methods for the logs-view counts
  getTotalIssueCount(): number {
    return this.logsByProjectId.length;
  }
  
  getTotalIssueCountByPriority(priority: string): number {
    return this.logsByProjectId.filter(log => log.severity === priority).length;
  }
  
  getHighPriorityFilteredCount(): number {
    return this.filteredLogs.filter(log => log.severity === 'HIGH').length;
  }
  
  getMediumPriorityFilteredCount(): number {
    return this.filteredLogs.filter(log => log.severity === 'MEDIUM').length;
  }
  
  getLowPriorityFilteredCount(): number {
    return this.filteredLogs.filter(log => log.severity === 'LOW').length;
  }
  
  // Force a refresh of all project counts
  forceSyncCounts() {
    this.loading = true;
    this.showNotification('Syncing issue counts...', 'success');
    
    // Create an array to hold all the API calls
    const projectRequests = this.projects.map(project => {
      return this.fetchAndCacheProjectLogs(project.id);
    });
    
    // Wait for all requests to complete
    forkJoin(projectRequests).subscribe({
      next: () => {
        this.loading = false;
        this.showNotification('Issue counts synced successfully', 'success');
        
        // If we're on the logs view and have a selected project, refresh that too
        if (this.selectedView === 'logs' && this.selectedProjectId) {
          this.filteredLogs = [...this.projectLogsCache[this.selectedProjectId]];
          this.applyFilters(); // Re-apply any filters
        }
      },
      error: (error) => {
        console.error('Error syncing issue counts:', error);
        this.loading = false;
        this.showNotification('Failed to sync some issue counts', 'error');
      }
    });
  }
  
  // Helper to fetch and cache logs for a project
  fetchAndCacheProjectLogs(projectId: number) {
    return this.logService.getLogsByProjectId(projectId.toString()).pipe(
      map(logs => {
        console.log(`Synced ${logs.length} logs for project ${projectId}`);
        
        // Normalize severity
        const normalizedLogs = logs.map(log => {
          if (log.severity) {
            log.severity = log.severity.toString().toUpperCase();
          }
          return log;
        });
        
        // Update the cache
        this.projectLogsCache[projectId.toString()] = normalizedLogs;
        
        return normalizedLogs;
      }),
      catchError(error => {
        console.error(`Error syncing logs for project ${projectId}:`, error);
        // Return empty array but don't update cache in case of error
        return of([]);
      })
    );
  }
  
  // Preload all project logs for accurate counts
  preloadAllProjectLogs() {
    console.log('Preloading logs for all projects...');
    
    // For each project, fetch and cache its logs silently in the background
    if (this.projects && this.projects.length > 0) {
      this.projects.forEach(project => {
        this.fetchAndCacheProjectLogs(project.id).subscribe();
      });
    }
  }
}

@Component({
  selector: 'app-update-priority-dialog',
  template: `
    <h2 mat-dialog-title>Update Priority</h2>
    <div mat-dialog-content>
      <p>Select a new priority for this issue:</p>
      <div class="priority-selector">
        <button *ngFor="let p of priorities" 
                [class.selected]="p === data.priority"
                (click)="selectPriority(p)"
                [ngClass]="{
                  'priority-high': p === 'HIGH',
                  'priority-medium': p === 'MEDIUM',
                  'priority-low': p === 'LOW'
                }">
          {{ p }}
        </button>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
    </div>
  `,
  styles: [`
    .priority-selector { display: flex; gap: 10px; margin: 20px 0; }
    .priority-selector button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .priority-high { background: rgba(244, 67, 54, 0.1); color: #f44336; }
    .priority-medium { background: rgba(255, 152, 0, 0.1); color: #ff9800; }
    .priority-low { background: rgba(76, 175, 80, 0.1); color: #4caf50; }
    .selected { box-shadow: 0 0 0 2px currentColor; }
  `],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule, FormsModule]
})
export class UpdatePriorityDialogComponent {
  data: { priority: string };
  priorities = ['HIGH', 'MEDIUM', 'LOW'];
  
  constructor(
    public dialogRef: MatDialogRef<UpdatePriorityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { priority: string }
  ) {
    this.data = data;
  }
  
  selectPriority(priority: string) {
    this.dialogRef.close(priority);
  }
  
  onCancel() {
    this.dialogRef.close();
  }
}
