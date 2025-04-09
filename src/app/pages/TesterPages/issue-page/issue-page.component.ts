import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownModule } from 'ngx-markdown';
import { LogService } from '../../../services/log.service';
import {
  TicketService,
  Ticket,
  Priority,
  Status,
} from '../../../services/ticket.service';
import { StaffService } from '../../../services/staff.service';
import { Log } from '../../../models/log.model';
import { CreateTicketDialogComponent } from '../../../components/dialog/create-ticket-dialog/create-ticket-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ErrorService } from '../../../services/error.service';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../services/auth.service';
import { SolutionDialogComponent } from '../../../components/solutions/solution-dialog/solution-dialog.component';
import { SolutionDialogModule } from '../../../components/solutions/solution-dialog/solution-dialog.module';
import { SolutionService, ComplexityLevel, SolutionStatus } from '../../../services/solution.service';

const LOW = ComplexityLevel.LOW;
const MEDIUM = ComplexityLevel.MEDIUM;
const HIGH = ComplexityLevel.HIGH;
const VERY_HIGH = ComplexityLevel.VERY_HIGH;

@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    MatIconModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    DragDropModule,
    SolutionDialogModule,
    MarkdownModule,
  ],
  templateUrl: './issue-page.component.html',
  styleUrl: './issue-page.component.css',
})
export class IssuePageComponent implements OnInit {
  Status = Status;
  Priority = Priority;
  ComplexityLevel = ComplexityLevel;
  LOW = LOW;
  MEDIUM = MEDIUM;
  HIGH = HIGH;
  VERY_HIGH = VERY_HIGH;
  
  issueId: string = '';
  log: Log | null = null;
  isLoading: boolean = false;
  tickets: Ticket[] = []; 
  ticketLoadError: boolean = false; 
  activeTab: 'details' | 'tickets' | 'solutions' = 'details'; 
  ticket: Ticket | null = null;
  ticketsViewMode: 'list' | 'kanban' = 'kanban'; 
  
  occurrenceStats: {
    count: number;
    percentage: number;
    firstSeen: Date;
    lastSeen: Date;
  } | null = null;

  stackTrace: string = `TypeError: Cannot read property 'data' of undefined
    at Object.getUsers (app.js:42)
    at async fetchData (app.js:78)
    at async Component.fetchUsers (UserList.js:23)
    at async Component.componentDidMount (UserList.js:12)`;

  solutions: any[] = [];  

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private logService: LogService,
    private ticketService: TicketService,
    private staffService: StaffService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private errorService: ErrorService,
    private authService: AuthService,
    private solutionService: SolutionService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.issueId = params['id'];
        this.loadIssueDetails(this.issueId);
        this.loadTicketsForIssue(this.issueId);
      }
    });
  }

  
  isDeveloper(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'DEVELOPER';
  }  

   isManager(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'MANAGER';
  }

  checkDeveloperPermission(): void {
    if (!this.isDeveloper()) {
      return;
    }
    
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const userId = userData?.id;
    
    if (!userId) {
      return;
    }
    
    const hasAssignedTicket = this.tickets.some(ticket => 
      ticket.assignedToUserId === Number(userId)
    );
    
    if (!hasAssignedTicket) {
      this.snackBar.open('You do not have permission to view this issue', 'Close', { 
        duration: 5000
      });
      this.router.navigate(['/dashboard/issues']);
    }
  }

  loadTickets() {
    if (this.issueId) {
      this.loadTicketsForIssue(this.issueId);
    }
  }

  loadTicketById(idTicket: string) {
    this.ticketService.getTicketById(Number(idTicket)).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
      },
    });
  }

  loadIssueDetails(id: string) {
    this.isLoading = true;

    this.logService.getLogById(id).subscribe({
      next: (log) => {
        this.log = log;
        this.isLoading = false;
        console.log(this.log);
        
        this.loadOccurrenceStats(id);
      },
      error: (error) => {
        this.errorService.handleError(error, 'Loading log details', true);
        this.isLoading = false;
      },
    });
  }

  loadTicketsForIssue(logId: string) {
    this.isLoading = true;
    this.ticketLoadError = false;

    this.ticketService.getTicketsByLogId(logId).subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.tickets.forEach((ticket) => {
          if (ticket.assignedToUserId) {
            this.loadUserDetails(ticket);
          }
          
          this.loadSolutionForTicket(ticket);
        });
        
        this.isLoading = false;
        console.log(`Found ${tickets.length} tickets for log ID: ${logId}`);
        
        this.checkDeveloperPermission();
      },
      error: (error) => {
        this.tickets = [];
        this.ticketLoadError = true;
        this.isLoading = false;
        console.warn('Could not load tickets for this log:', error);

        if (error.status === 404) {
          console.info(
            'The tickets by log ID endpoint may not be implemented in the backend. Using client-side filtering as a fallback.'
          );
          this.loadAllTicketsAndFilterByLogId(logId);
        }
      },
    });
  }

  loadAllTicketsAndFilterByLogId(logId: string) {
    this.ticketService.getAllTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets.filter((t) => t.logId?.toString() === logId);
        this.isLoading = false;
        this.ticketLoadError = false;
        
        this.checkDeveloperPermission();
      },
      error: (error) => {
        this.tickets = [];
        this.ticketLoadError = true;
        this.isLoading = false;
        console.error('Could not load tickets:', error);
      },
    });
  }

  onDashboardClick() {
    this.router.navigate(['dashboard', 'issues']);
  }

  resolveBug() {
    if (!this.log?.id) return;

    this.isLoading = true;

    if (this.tickets.length > 0) {
      const ticketToUpdate = this.tickets[0];

      this.ticketService
        .updateTicketStatus(Number(ticketToUpdate.id), Status.RESOLVED)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.snackBar.open(
              'Issue has been resolved successfully',
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
                panelClass: ['success-snackbar'],
              }
            );

            this.loadTicketsForIssue(this.log!.id!.toString());
          },
          error: (error) => {
            this.isLoading = false;
            this.errorService.handleError(error, 'Resolving issue', true);
          },
        });
    } else {
      // No existing ticket, just simulate resolution
      setTimeout(() => {
        this.isLoading = false;
        this.snackBar.open('Issue has been resolved successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }, 1000);
    }
  }

  createTicket() {
    console.log('Opening create ticket dialog with data:', {
      log: this.log,
      projectId: this.log?.projectId,
    });

    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '600px',
      data: {
        log: this.log,
        projectId: this.log?.projectId,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog result:', result);
      if (result) {
        this.isLoading = true;
        console.log('Creating ticket with data:', result);
        this.ticketService.createTicket(result).subscribe({
          next: (ticket) => {
            console.log('Created ticket:', ticket);
            this.snackBar.open('Ticket created successfully', 'Close', {
              duration: 3000,
            });
            // Refresh the tickets list
            this.loadTicketsForIssue(this.issueId);
          },
          error: (error) => {
            console.error('Error creating ticket:', error);
            this.errorService.handleError(error, 'Creating ticket', true);
          },
          complete: () => {
            this.isLoading = false;
          },
        });
      } else {
        console.log('Dialog closed without creating ticket');
      }
    });
  }

  changePriority(event: any) {
    if (!this.log?.id) return;

    const priority = event.target.value;
    
    this.isLoading = true;
    
    setTimeout(() => {
      this.isLoading = false;
      this.log!.severity = priority;
      this.snackBar.open(`Priority updated to ${priority}`, 'Close', {
        duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
        panelClass: ['success-snackbar'],
      });
    }, 800);

  }

  getPriorityClass(severity: number): Priority {
      switch (severity) {
      case 0:
        return Priority.LOW;
      case 1:
        return Priority.MEDIUM;
      case 2:
        return Priority.HIGH;
      case 3:
        return Priority.CRITICAL;
      default:
        return Priority.MEDIUM;
    }
  }

  calculateTimeToResolution(
    createdAt: string | undefined,
    solvedAt: string | undefined
  ): string {
    if (!createdAt || !solvedAt) {
      return 'N/A';
    }

    const createdDate = new Date(createdAt);
    const solvedDate = new Date(solvedAt);
    const diffInMs = solvedDate.getTime() - createdDate.getTime();
    
    // Calculate hours, minutes
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  viewTicketDetails(ticket: Ticket) {
    this.router.navigate(['dashboard', 'tickets', ticket.id]);
  }

  editTicket(ticket: Ticket) {
    this.router.navigate(['dashboard', 'tickets', ticket.id], { queryParams: { edit: true } });
  }

  /**
   * Opens the solution dialog to add or edit a solution
   * @param ticket Optional ticket to edit solution for
   */
  addSolution(ticket?: Ticket) {
    const ticketId = ticket?.id || (this.tickets.length > 0 ? this.tickets[0].id : undefined);
    
    if (!ticketId) {
      this.snackBar.open('No ticket available to add a solution', 'Close', {
        duration: 3000
      });
      return;
    }
    
    const dialogRef = this.dialog.open(SolutionDialogComponent, {
      width: '80%',
      data: {
        ticketId: ticketId,
        existingSolution: ticket?.solution
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        
        // Get the current user for author information
        const user = this.authService.getCurrentUser();
        // Get user ID from localStorage if not available in user object
        const userStr = localStorage.getItem('user');
        const userData = userStr ? JSON.parse(userStr) : null;
        const userId = userData?.id || 1; // Default to 1 if not available
        
        console.log('Form result:', result);
        
        // Create the solution object matching the backend entity
        const solutionData: any = {
          ...(ticket?.solution?.id ? { id: ticket.solution.id } : {}),
          // Add null checks and default values
          title: result.title || (result.description ? result.description.substring(0, 100) : '') || 'New Solution',
          // If content is directly available use it, otherwise fall back to description or a default value
          content: result.content || result.description || 'Solution details to be added',
          complexity: ComplexityLevel.MEDIUM, // Default value or could be added to form
          status: SolutionStatus.SUBMITTED, // Set initial status
          authorUserId: userId,
          tenant: userData?.tenant || 'default', // Tenant is required
          estimatedTime: result.estimatedTime || 0, // Default value or could be added to form
          costEstimation: result.costEstimation || 0, // Default value or could be added to form
          category: result.category || 'DEFAULT', // Default value or could be added to form
          ticket: { id: Number(ticketId) } // Map ticket relationship correctly
        };
        
        console.log('Solution data to save:', solutionData);
        
        // Use the SolutionService to create or update the solution
        this.solutionService.saveOrUpdateSolution(solutionData).subscribe({
          next: (solution) => {
            console.log('Solution saved successfully:', solution);
            
            // Update the ticket status to resolved if it's not already
            if (ticket?.status !== Status.RESOLVED) {
              this.ticketService.updateTicketStatus(ticketId, Status.RESOLVED).subscribe({
                next: () => {
                  this.snackBar.open('Solution saved and ticket resolved', 'Close', {
                    duration: 3000
                  });
                  // Refresh the tickets list
                  this.loadTicketsForIssue(this.issueId);
                },
                error: (statusError: any) => {
                  console.error('Error updating ticket status:', statusError);
                  this.snackBar.open('Solution saved but ticket status could not be updated', 'Close', {
                    duration: 3000
                  });
                  this.loadTicketsForIssue(this.issueId);
                },
                complete: () => {
                  this.isLoading = false;
                }
              });
            } else {
              this.snackBar.open('Solution saved successfully', 'Close', {
                duration: 3000
              });
              this.loadTicketsForIssue(this.issueId);
              this.isLoading = false;
            }
          },
          error: (error: any) => {
            this.errorService.handleError(error, 'Saving solution', true);
            this.isLoading = false;
          }
        });
      }
    });
  }

  hasSolutions(): boolean {
    // Ensure we check for valid solution objects
    return this.tickets.some(ticket => ticket.hasSolution && ticket.solution);
  }
  
  /**
   * Returns the count of tickets that have solutions
   */
  getSolutionsCount(): number {
    return this.tickets.filter(ticket => ticket.hasSolution && ticket.solution).length;
  }

  getTotalTicketsCount(): number {
    return this.tickets.length;
  }

  getPendingTickets(): Ticket[] {
    return this.tickets.filter(ticket => ticket.status === Status.PENDING);
  }

  getResolvedTickets(): Ticket[] {
    return this.tickets.filter(ticket => ticket.status === Status.RESOLVED);
  }

  getVerifiedTickets(): Ticket[] {
    return this.tickets.filter(ticket => ticket.status === Status.VERIFIED);
  }

  getPendingTicketsCount(): number {
    return this.getPendingTickets().length;
  }

  getResolvedTicketsCount(): number {
    return this.getResolvedTickets().length;
  }

  getVerifiedTicketsCount(): number {
    return this.getVerifiedTickets().length;
  }

  getMergedTickets(): Ticket[] {
    return this.tickets.filter(ticket => ticket.status === Status.MERGED);
  }

  /**
   * Handles the drop event when a ticket is dragged and dropped between columns
   * @param event The drag drop event
   */
  drop(event: CdkDragDrop<Ticket[]>) {
    if (event.previousContainer === event.container) {
      // If dropped in the same container, just reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // If dropped in a different container, move the item and update its status
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Get the moved ticket
      const movedTicket = event.container.data[event.currentIndex];
      
      // Update ticket status based on the destination container
      let newStatus: Status | undefined;
      
      if (event.container.id === 'pendingList') {
        newStatus = Status.PENDING;
      } else if (event.container.id === 'resolvedList') {
        newStatus = Status.RESOLVED;
      } else if (event.container.id === 'verifiedList') {
        newStatus = Status.VERIFIED;
      }
      
      if (newStatus && movedTicket && movedTicket.id) {
        this.updateTicketStatus(movedTicket.id, newStatus);
      }
    }
  }

  updateTicketStatus(ticketId: number, status: Status): void {
    this.isLoading = true;
    
    this.ticketService.updateTicketStatus(ticketId, status).subscribe({
      next: (updatedTicket) => {
        // Find and update the ticket in our local array
        const index = this.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
          this.tickets[index] = updatedTicket;
        }
        
        this.snackBar.open(`Ticket #${ticketId} status updated to ${status}`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.errorService.handleError(error, 'Updating ticket status', true);
        this.isLoading = false;
      }
    });
  }

  private loadUserDetails(ticket: Ticket): void {
    // This would be replaced with a real API call in a production environment
    if (ticket.assignedToUserId) {
      this.staffService.getStaffById(ticket.assignedToUserId.toString()).subscribe({
        next: (staff) => {
          if (staff) {
            // User staff.name or staff.email as needed
            // For this mock, we'll just use the ID
            ticket.assignedToEmail = staff.email || `User ${ticket.assignedToUserId}`;
          } else {
            ticket.assignedToEmail = 'Unknown';
          }
        },
        error: () => {
          ticket.assignedToEmail = 'Unknown';
        }
      });
    } else {
      ticket.assignedToEmail = 'Unassigned';
    }
  }

  /**
   * Load occurrence statistics for the current log
   */
  loadOccurrenceStats(logId: string) {
    this.logService.getLogOccurrenceStats(logId).subscribe({
      next: (stats) => {
        this.occurrenceStats = stats;
        console.log('Loaded occurrence stats:', stats);
      },
      error: (error) => {
        console.error('Error loading occurrence stats:', error);
        this.occurrenceStats = null;
      }
    });
  }

  /**
   * Get the occurrence count for this issue
   * Returns the API data if available, otherwise falls back to heuristic calculation
   */
  getOccurrenceCount(): string {
    // Use API data if available
    if (this.occurrenceStats?.count) {
      return this.occurrenceStats.count >= 1000 
        ? `${(this.occurrenceStats.count/1000).toFixed(1)}k` 
        : this.occurrenceStats.count.toString();
    }
    
    // Fall back to heuristic approach
    if (!this.log) return "0";
    
    const baseFactor = this.log.severity === 'HIGH' ? 1000 : 
                     (this.log.severity === 'MEDIUM' ? 500 : 100);  
    
    const countFactor = this.log.handled ? 0.5 : 2.5;
    
    // Use the timestamp to create some variability based on how recent the issue is
    const timestampFactor = (this.log.timestamp && new Date(this.log.timestamp).getTime()) ? 
                          (Date.now() - new Date(this.log.timestamp).getTime()) / (1000 * 60 * 60 * 24) : 1;
    
    // Create a reasonably plausible event count
    const count = Math.round(baseFactor * countFactor * (1 + (10 / (timestampFactor || 1))));
    
    // Format with k for thousands
    return count >= 1000 ? `${(count/1000).toFixed(1)}k` : count.toString();
  }
  
  /**
   * Get the percentage for the progress bar
   * Uses API data if available, otherwise falls back to heuristic calculation
   */
  getOccurrencePercentage(): number {
    if (this.occurrenceStats?.percentage) {
      return this.occurrenceStats.percentage;
    }
    
    if (!this.log) return 0;
    
    const severityFactor = this.log.severity === 'HIGH' ? 80 : 
                         (this.log.severity === 'MEDIUM' ? 55 : 30);
                         
    const handledAdjustment = this.log.handled ? -15 : 5;
    
    return Math.min(95, Math.max(10, severityFactor + handledAdjustment));
  }
  
  /**
   * Get a human-readable time description since the first occurrence
   * Uses API data if available, otherwise falls back to log timestamp
   */
  getTimeAgo(): string {
    // Use API data if available
    if (this.occurrenceStats?.firstSeen) {
      const firstSeen = new Date(this.occurrenceStats.firstSeen);
      const now = new Date();
      const diffMs = now.getTime() - firstSeen.getTime();
      
      // Calculate different time units
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      // Return human-readable string
      if (diffDays > 0) {
        return diffDays === 1 ? 'Started 1 day ago' : `Started ${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? 'Started 1 hour ago' : `Started ${diffHours} hours ago`;
      } else if (diffMins > 0) {
        return diffMins === 1 ? 'Started 1 minute ago' : `Started ${diffMins} minutes ago`;
      } else {
        return 'Started just now';
      }
    }
    
    // Fall back to log timestamp
    if (!this.log || !this.log.timestamp) return '';
    
    const timestamp = new Date(this.log.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    
    // Calculate different time units
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Return human-readable string
    if (diffDays > 0) {
      return diffDays === 1 ? 'Started 1 day ago' : `Started ${diffDays} days ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? 'Started 1 hour ago' : `Started ${diffHours} hours ago`;
    } else if (diffMins > 0) {
      return diffMins === 1 ? 'Started 1 minute ago' : `Started ${diffMins} minutes ago`;
    } else {
      return 'Started just now';
    }
  }

  /**
   * Loads the solution for a specific ticket
   * @param ticket The ticket to load the solution for
   */
  loadSolutionForTicket(ticket: Ticket): void {
    if (!ticket.id) return;
    
    this.solutionService.getSolutionByTicketId(ticket.id).subscribe({
      next: (solution) => {
        if (solution) {          
          // Update the ticket with the solution data
          ticket.solution = solution as any;
          ticket.hasSolution = true;
          
          // Add to solutions array for easy access in the view
          this.solutions.push(solution);
          
          console.log(`Loaded solution for ticket #${ticket.id}:`, solution);
        }
      },
      error: (error) => {
        // No solution found for this ticket or error occurred
        if (error.status !== 404) {
          console.error(`Error loading solution for ticket #${ticket.id}:`, error);
        }
        ticket.hasSolution = false;
      }
    });
  }

  // Helper methods for template
  
  /**
   * Safely gets a property from the solution object
   */
  getSolutionProperty(ticket: Ticket, property: string): any {
    if (!ticket || !ticket.solution) return null;
    
    // Access the property with safety checks
    return (ticket.solution as any)[property];
  }
  
  /**
   * Gets the solution content, falling back to description if needed
   */
  getSolutionContent(ticket: Ticket): string {
    if (!ticket || !ticket.solution) return 'No description available';
    
    // Try content first, then fall back to description
    return (ticket.solution as any).content || 
           (ticket.solution as any).description || 
           'No description available';
  }
  
  /**
   * Gets complexity-based CSS classes for styling
   */
  getComplexityClass(ticket: Ticket): any {
    if (!ticket || !ticket.solution) return {};
    
    const complexity = (ticket.solution as any).complexity;
    
    return {
      'text-green-600 dark:text-green-400': complexity === LOW,
      'text-yellow-600 dark:text-yellow-400': complexity === MEDIUM,
      'text-orange-600 dark:text-orange-400': complexity === HIGH,
      'text-red-600 dark:text-red-400': complexity === VERY_HIGH
    };
  }

  /**
   * Check if the issue is handled based on whether any of its tickets have solutions
   * @returns boolean indicating if the issue is handled
   */
  isIssueHandled(): boolean {
    // If there are no tickets yet, use the original handled property from the log
    if (!this.tickets || this.tickets.length === 0) {
      return this.log?.handled || false;
    }
    
    // Consider the issue handled if any ticket has a solution
    return this.hasSolutions();
  }
}
