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
import { ProjectTypePipe } from './project-type.pipe';
import { Ticket, Status } from '../../../../services/ticket.service';
import { SolutionService } from '../../../../services/solution.service';
import { Solution } from '../../../../models/ticket.model';
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
    MatDialogModule,
    ProjectTypePipe
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
    private dialog: MatDialog,
    private solutionService: SolutionService
  ) {
    // Set a default user ID to avoid "User ID not found" error
    this.userId = 1;
  }

  // Data properties
  logs: Log[] = [];
  tickets: Ticket[] = []; 
  ticket: Ticket | null = null;
  projects: Project[] = [];
  selectedProjectId: string = '';
  tenant: string = '';
  userId: number = 0;
  userRole: string = '';
  solutions: any[] = [];
  // UI state properties
  loading: boolean = false;
  selectedView: 'projects' | 'logs' = 'projects';
  logsByProjectId: Log[] = [];
  filteredLogs: Log[] = [];
  priorityFilter: string = '';
  handledFilter: 'all' | 'handled' | 'notHandled' = 'all';
  isFilterDropdownOpen: boolean = false;
  searchQuery = '';
  // Project type properties
  projectTypeFilter: 'all' | 'package' | 'monolithic' = 'all';
  currentPackageId: number | null = null;
  isViewingPackage: boolean = false;
  microservicesInPackage: Project[] = [];
  currentPackage: Project | null = null;
  loadingMicroservices: boolean = false;
  selectedMicroservice: Project | null = null;

  // Cache properties
  projectLogsCache: Record<string, Log[]> = {};
  isDeveloper: boolean = false;
  assignableLogIds = new Set<string>();
    
  // Add these properties
  allMicroservices: Project[] = [];
  microserviceMembership: Map<number, boolean> = new Map();
   
  // Add these properties for microservice filtering
  microserviceSearchQuery: string = '';
  microserviceFilter: 'all' | 'accessible' | 'restricted' = 'all';

  // Add computed property for filtered microservices
  get filteredMicroservices(): Project[] {
    let filtered = [...this.allMicroservices];

    // Apply search filter
    if (this.microserviceSearchQuery) {
      const query = this.microserviceSearchQuery.toLowerCase();
      filtered = filtered.filter(ms => 
        ms.name.toLowerCase().includes(query) || 
        ms.description.toLowerCase().includes(query)
      );
    }

    // Apply accessibility filter
    if (this.microserviceFilter === 'accessible') {
      filtered = filtered.filter(ms => this.isMemberOfMicroservice(ms));
    } else if (this.microserviceFilter === 'restricted') {
      filtered = filtered.filter(ms => !this.isMemberOfMicroservice(ms));
    }

    return filtered;
  }

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
      
      // Get userId directly from localStorage or from the user object
      // First try to get it from the separate userId key
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        this.userId = parseInt(storedUserId, 10);
      } 
      // If not found, try to get it from the user object
      else if (userData && userData.id) {
        this.userId = Number(userData.id);
        // Also save it separately for future use
        localStorage.setItem('userId', userData.id.toString());
      } 
     
      
      console.log('Using user ID:', this.userId);
      
      this.userRole = currentUser.role || '';
      this.isDeveloper = this.userRole === Role.DEVELOPER;
      
      // Always load projects and logs
      this.loadUserProjects();
      this.loadLogs();
    } else {
      this.showNotification('User information not found', 'error');
    }
  }
 
  loadUserProjects() {
    this.loading = true;
    
    // Use a default user ID (1) if none is available
    const userId = this.userId;
    console.log('Loading projects for user ID:', userId);
    
    this.projectService.getUserProjects(userId).subscribe({
      next: (projects) => {
        console.log('Projects received from API:', projects);
        
        if (this.userRole === Role.MANAGER) {
          // For managers, we need to handle microservices differently
          const microservices = projects.filter(p => p.projectType === 'MICROSERVICES');
          const otherProjects = projects.filter(p => p.projectType !== 'MICROSERVICES');
          
          console.log(`Manager projects breakdown: ${microservices.length} microservices, ${otherProjects.length} other projects`);
          
          // If there are no microservices, just use the other projects
          if (microservices.length === 0) {
            console.log('No microservices found for this manager, using regular projects only');
            this.projects = otherProjects;
            this.loading = false;
            return;
          }
          
          // For each microservice, get its parent package
          const packageRequests = microservices.map(ms => {
            if (ms.parentProject && ms.parentProject.id) {
              console.log(`Getting parent package for microservice ${ms.name} (ID: ${ms.getId()}), parent ID: ${ms.parentProject.id}`);
              return this.projectService.getProjectById(ms.parentProject.id).pipe(
                catchError(error => {
                  console.error(`Failed to load parent package for microservice ${ms.getId()}:`, error);
                  return of(null);
                })
              );
            }
            console.log(`Microservice ${ms.name} (ID: ${ms.getId()}) has no parent project defined`);
            return of(null);
          });

          // Wait for all package requests to complete
          forkJoin(packageRequests).subscribe({
            next: (packages) => {
              console.log('Parent packages retrieved:', packages);
              
              // Filter out null values and duplicates
              const uniquePackages = packages
                .filter((p): p is Project => p !== null)
                .filter((p, index, self) => 
                  index === self.findIndex(t => t.getId() === p.getId())
                );
              
              console.log(`Found ${uniquePackages.length} unique parent packages`);
              
              // Combine unique packages with other projects
              this.projects = [...uniquePackages, ...otherProjects];
              
              // If no projects were found, show a notification
              if (this.projects.length === 0) {
                this.showNotification('No projects found for your account', 'warning');
              }
              
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading packages:', error);
              this.loading = false;
              this.showNotification('Failed to load some project packages', 'error');
              
              // Fallback to showing just the other projects if there was an error
              this.projects = otherProjects;
            }
          });
        } else {
          // For other roles, keep the existing behavior
          this.projects = projects;
          
          // If no projects were found, show a notification
          if (this.projects.length === 0) {
            this.showNotification('No projects found for your account', 'warning');
          }
          
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.loading = false;
        this.showNotification('Failed to load projects', 'error');
        this.projects = []; // Ensure projects is initialized as empty array on error
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
            totalIssues: this.getIssueCountForProject(firstProject.getId()),
            highPriority: this.getIssueCountByPriority(firstProject.getId(), 'HIGH'),
            mediumPriority: this.getIssueCountByPriority(firstProject.getId(), 'MEDIUM'),
            lowPriority: this.getIssueCountByPriority(firstProject.getId(), 'LOW')
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
  onSearchProjects(event: any): void {
    this.searchQuery = event.target.value;
    this.applyFilters();
  }
  loadLogsByProjectId(projectId: string) {
    this.loading = true;
    this.logService.getLogsByProjectId(projectId).subscribe({
      next: (logs) => {
        this.logsByProjectId = logs;
        this.filteredLogs = [...logs];
        
        // Load tickets for all logs
        const ticketRequests = logs.map(log => 
          this.ticketService.getTicketsByLogId(log.id!.toString()).pipe(
            switchMap(tickets => {
              // For each ticket, check if it has a solution
              const solutionRequests = tickets.map(ticket =>
                this.solutionService.getSolutionByTicketId(ticket.id!).pipe(
                  map(solution => {
                    ticket.solution = {
                      id: solution.id,
                      ticketId: ticket.id!,
                      description: solution.content || '',
                      codeSnippet: solution.content || '',
                      createdByUserId: solution.authorUserId,
                      createdAt: solution.createdAt,
                      updatedAt: solution.updatedAt
                    };
                    return ticket;
                  }),
                  catchError(() => of(ticket))
                )
              );
              return forkJoin(solutionRequests).pipe(
                catchError(() => of(tickets))
              );
            }),
            catchError(error => {
              console.error(`Error loading tickets for log ${log.id}:`, error);
              return of([]);
            })
          )
        );

        // Combine all ticket requests
        forkJoin(ticketRequests).subscribe({
          next: (ticketsArray) => {
            this.tickets = ticketsArray.flat();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading tickets:', error);
            this.loading = false;
          }
        });

        if (this.isDeveloper) {
          this.filterLogsByDeveloperAssignment();
        }
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.loading = false;
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
    this.priorityFilter = ''; // Reset priority filter when changing projects
    this.handledFilter = 'all'; // Reset handled filter when changing projects
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
    this.priorityFilter = ''; // Reset priority filter when selecting a project
    this.handledFilter = 'all'; // Reset handled filter when selecting a project
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
    const project = this.projects.find(p => p.getId().toString() === this.selectedProjectId);
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
    let initialLogs: Log[] = [];

    if (!this.isDeveloper) {
      // Non-developers see all logs with priority filter
      initialLogs = [...this.logsByProjectId];
    } else {
      // For developers, we need to maintain the assignment filter
      // Get the current set of logs the developer can access
      initialLogs = this.logsByProjectId.filter(log => this.canAccessLog(log));
    }
    
    // Apply priority filter if set
    if (this.priorityFilter) {
      initialLogs = initialLogs.filter(log => 
        log.severity === this.priorityFilter
      );
    }
    
    // Apply handled status filter if not set to 'all'
    if (this.handledFilter !== 'all') {
      initialLogs = initialLogs.filter(log => {
        const isHandled = this.isIssueHandled(log.id);
        return this.handledFilter === 'handled' ? isHandled : !isHandled;
      });
    }
    
    this.filteredLogs = initialLogs;
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
      return this.fetchAndCacheProjectLogs(project.getId());
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
    
    // Only preload for projects that don't have cached logs
    this.projects.forEach(project => {
      // Skip if already cached
      if (this.projectLogsCache[project.getId().toString()]) {
        return;
      }
      
      // Fetch and cache logs
      this.fetchAndCacheProjectLogs(project.getId()).subscribe();
    });
  }

  isPackage(project: Project): boolean {
    return project.projectType === 'MICROSERVICES_PACKAGE';
  }

  isMicroservice(project: Project): boolean {
    return project.projectType === 'MICROSERVICES';
  }

  openPackage(packageProject: Project): void {
    this.loadingMicroservices = true;
    this.currentPackageId = packageProject.getId();
    this.currentPackage = packageProject;
    this.isViewingPackage = true;
    this.selectedMicroservice = null;
    this.microserviceSearchQuery = ''; // Reset search
    this.microserviceFilter = 'all'; // Reset filter
    
    this.projectService.getMicroservicesInPackage(packageProject.getId()).subscribe({
      next: (microservices) => {
        this.allMicroservices = microservices;
        
        // Create an array of observables to check membership for each microservice
        const membershipChecks = microservices.map(ms => 
          this.projectService.getProjectMembers(ms.getId()).pipe(
            map(members => ({
              microservice: ms,
              isMember: members.some(member => member.id === this.userId)
            })),
            catchError(error => {
              console.error(`Error checking membership for microservice ${ms.getId()}:`, error);
              return of({ microservice: ms, isMember: false });
            })
          )
        );

        // Wait for all membership checks to complete
        forkJoin(membershipChecks).subscribe({
          next: (results) => {
            // Store membership information
            results.forEach(result => {
              this.microserviceMembership.set(result.microservice.getId(), result.isMember);
            });

            // Filter accessible microservices for operations
            this.microservicesInPackage = results
              .filter(result => result.isMember || this.userRole === 'TESTER')
              .map(result => result.microservice);

            this.loadingMicroservices = false;
            
            if (this.microservicesInPackage.length === 0) {
              this.showNotification('No microservices found that you are a member of', 'success');
            }
            
            this.loadLogsForMicroservices();
          },
          error: (error) => {
            console.error('Error checking microservice memberships:', error);
            this.showNotification('Failed to verify microservice access', 'error');
            this.loadingMicroservices = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading microservices:', error);
        this.showNotification('Failed to load microservices in this package', 'error');
        this.loadingMicroservices = false;
      }
    });
  }

  loadLogsForMicroservices(): void {
    if (!this.microservicesInPackage.length) return;

    const logRequests = this.microservicesInPackage.map(microservice => 
      this.logService.getLogsByProjectId(microservice.getId().toString()).pipe(
        catchError(error => {
          console.error(`Error loading logs for microservice ${microservice.getId()}:`, error);
          return of([]);
        })
      )
    );

    forkJoin(logRequests).subscribe({
      next: (logsArray) => {
        // Combine all logs and update the cache
        logsArray.forEach((logs, index) => {
          const microserviceId = this.microservicesInPackage[index].getId().toString();
          this.projectLogsCache[microserviceId] = logs;
        });
      },
      error: (error) => {
        console.error('Error loading microservice logs:', error);
        this.showNotification('Failed to load some microservice logs', 'error');
      }
    });
  }

  selectMicroservice(microservice: Project): void {
    if (!this.isMemberOfMicroservice(microservice)) {
      return;
    }
    this.selectedMicroservice = microservice;
    this.selectedProjectId = microservice.getId().toString();
    this.selectedView = 'logs';
    this.loadLogsByProjectId(this.selectedProjectId);
  }

  backToMicroservicesList(): void {
    this.selectedMicroservice = null;
    this.selectedProjectId = '';
    this.selectedView = 'projects';
    this.filteredLogs = [];
  }

  backToProjects(): void {
    this.isViewingPackage = false;
    this.currentPackageId = null;
    this.currentPackage = null;
    this.microservicesInPackage = [];
    this.allMicroservices = [];
    this.microserviceMembership.clear();
    this.selectedMicroservice = null;
    this.selectedProjectId = '';
    this.selectedView = 'projects';
    this.filteredLogs = [];
    this.microserviceSearchQuery = '';
    this.microserviceFilter = 'all';
  }

  // Add this helper method
  isMemberOfMicroservice(microservice: Project): boolean {
    return this.userRole === 'TESTER' || this.microserviceMembership.get(microservice.getId()) || false;
  }

  // Helper method to convert string ID to number
  getProjectIdAsNumber(): number {
    return this.selectedProjectId ? parseInt(this.selectedProjectId) : 0;
  }

  isIssueHandled(issueId: string | number | undefined): boolean {
    if (!issueId) return false;
    
    // Find all tickets for this issue
    const issueTickets = this.tickets.filter(ticket => 
      ticket.logId?.toString() === issueId.toString()
    );
    
    // Check if any ticket has a solution
    return issueTickets.some(ticket => ticket.solution !== undefined && ticket.solution !== null);
  }

  // Toggle the filter dropdown visibility
  toggleFilterDropdown() {
    this.isFilterDropdownOpen = !this.isFilterDropdownOpen;
  }

  // Apply a filter and close the dropdown
  applyHandledFilter(filterValue: 'all' | 'handled' | 'notHandled') {
    this.handledFilter = filterValue;
    this.applyFilters();
    this.isFilterDropdownOpen = false;
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
  tickets: any;
  logs: any;
  ticketService: any;
  solutionService: any;

  constructor(
    public dialogRef: MatDialogRef<UpdatePriorityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { priority: string }
  ) {
    this.data = data;
  }
  
  selectPriority(priority: string) {
    this.dialogRef.close(priority);
  }

  loadTickets() {
    if (this.logs.map((log: Log) => log.id)) {
      this.loadTicketsForIssue(this.logs.map((log: Log) => log.id));
    }
  }
  isIssueHandled(logId: number): boolean {
    if (!this.tickets || this.tickets.length === 0) {
        return this.logs.find((log: Log) => log.id === logId)?.handled || false;
    }
    return this.hasSolutions();
  }
  loadTicketsForIssue(logId: number) {
    console.log('Starting to load tickets for logId:', logId);
    this.ticketService.getTicketsByLogId(logId).subscribe({
      next: (tickets: Ticket[]) => {
        console.log('Received tickets from server:', tickets);
        this.tickets = tickets; // Keep the main list
        this.tickets.forEach((ticket: Ticket) => {
          this.loadSolutionForTicket(ticket);
        });
  
      },
      error: (error: any) => {
        console.error('Error loading tickets:', error);  },
    });
  }
  loadSolutionForTicket(ticket: Ticket): void {
    if (!ticket.id) return;
    
    this.solutionService.getSolutionByTicketId(ticket.id).subscribe({
      next: (solution: any) => {
        if (solution) {          
          ticket.solution = solution as any;          
          console.log(`Loaded solution for ticket #${ticket.id}:`, solution);
        }
      },
      error: (error: any) => {
        // No solution found for this ticket or error occurred
        if (error.status !== 404) {
          console.error(`Error loading solution for ticket #${ticket.id}:`, error);
        }
      }
    });
  }
  hasSolutions(): boolean {
    return this.tickets.some((ticket: Ticket) => ticket.solution);
  }
  
  onCancel() {
    this.dialogRef.close();
  }
}
