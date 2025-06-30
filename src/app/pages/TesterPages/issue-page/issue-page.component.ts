import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
import { SolutionService, ComplexityLevel, SolutionStatus, Solution as ServiceSolution, LogAnalysisRequest, DevelopersSolutions } from '../../../services/solution.service';
import { Subscription } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { CommentService, CommentRequest, CommentResponse } from '../../../services/comment.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatMenuModule } from '@angular/material/menu';
import { ProjectService } from '../../../services/project.service';
import { User } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { fromEvent } from 'rxjs';

// Define SimilarLog interface to match backend response format
interface SimilarLog {
  // Using 'any' interface to avoid property naming conflicts
  [key: string]: any;
}

// Extend the DevelopersSolutions interface to include authorName
interface ExtendedDeveloperSolution extends DevelopersSolutions {
  authorName?: string;
  severity?: string;
}

// Interface for AI-recommended solutions
interface AIRecommendedSolution {
  rootException: string;
  cause: string;
  location: string;
  exceptionChain: string[];
  recommendation: string;
  confidence: number;
  code?: string;
}

// Interface for developer community solutions
interface DeveloperSolution {
  id: number;
  source: string; // 'StackOverflow', 'GitHub', 'MSDN', etc.
  author: string;
  title: string;
  content: string;
  code: string;
  votes: number;
  commentCount: number;
  url: string;
  postedDate: Date;
  sourceIcon: string; // 'SO', 'GH', 'MS', etc.
}

// Define interface for Kanban columns in this component
interface IssuePageKanbanColumn {
  id: string;
  name: string;
  status: Status;
  color: string;
  icon: string;
  tickets: Ticket[];
}

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
    MatMenuModule
  ],
  templateUrl: './issue-page.component.html',
  styleUrl: './issue-page.component.css',
})
export class IssuePageComponent implements OnInit, OnDestroy {
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
  activeTab: 'details' | 'tickets' | 'solutions' | 'comments' = 'details'; 
  ticket: Ticket | null = null;
  ticketsViewMode: 'list' | 'kanban' = 'kanban'; 
  activeSolutionsTab: 'my-solutions' | 'developer-solutions' | 'ai-solutions' = 'my-solutions';
  
  occurrenceStats: {
    count: number;
    percentage: number;
    firstSeen: Date;
    lastSeen: Date;
  } | null = null;  

  stackTrace: string = this.log?.stackTrace || '';

  solutions: any[] = [];
  aiRecommendedSolution: AIRecommendedSolution | null = null;
  developerSolutions: ExtendedDeveloperSolution[] = [];

  showFullStackTrace: boolean = false;
  readonly stackTraceLimit: number = 7;

  // Store the current user role
  userRole: string = '';
  errorMessage: string | null = null;
  // Define columns for the Kanban view in issue-page
  kanbanColumns: IssuePageKanbanColumn[] = [
    {
      id: 'todoList',
      name: 'To Do',
      status: Status.TO_DO,
      color: 'gray',
      icon: 'assignment',
      tickets: []
    },
    {
      id: 'inProgressList',
      name: 'In Progress',
      status: Status.IN_PROGRESS,
      color: 'blue',
      icon: 'hourglass_empty',
      tickets: []
    },
    {
      id: 'resolvedList',
      name: 'Resolved',
      status: Status.RESOLVED,
      color: 'green',
      icon: 'task_alt',
      tickets: []
    },
    {
      id: 'mergedToTestList',
      name: 'Merged To Test',
      status: Status.MERGED_TO_TEST,
      color: 'purple',
      icon: 'merge_type',
      tickets: []
    },
    {
      id: 'verifiedList',
      name: 'Verified',
      status: Status.VERIFIED,
      color: 'amber',
      icon: 'verified',
      tickets: []
    },
    {
      id: 'doneList',
      name: 'Done',
      status: Status.DONE,
      color: 'teal',
      icon: 'done_all',
      tickets: []
    }
  ];

  // Comments-related properties
  comments: CommentResponse[] = [];
  isLoadingComments: boolean = false;
  isSubmittingComment: boolean = false;
  newCommentText: string = '';
  commentError: string | null = null;
  editingCommentId: number | null = null;
  editCommentText: string = '';
  hasMoreComments: boolean = false;
  isLoadingMoreComments: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  // Additional comment-related properties for replies
  replyingToCommentId: number | null = null;
  replyText: string = '';
  parentCommentMap: Map<number, CommentResponse> = new Map();

  // Add missing properties for comments
  replyToCommentId: number | null = null;
  rootComments: CommentResponse[] = [];
  currentUserId: number | null = null;

  // Add a map to store user details
  private userDetailsCache = new Map<number, any>();

  @ViewChild('commentTextarea') commentTextarea!: ElementRef;
  @ViewChild('newCommentTextarea') newCommentTextarea!: ElementRef;
  @ViewChild('editCommentTextarea') editCommentTextarea!: ElementRef;

  projectId: number = 0;
  projectMembers: User[] = [];
  filteredMembers: User[] = [];
  showNewCommentSuggestions = false;
  showEditCommentSuggestions = false;
  cursorPosition = 0;
  mentionStart = -1;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private logService: LogService,
    private ticketService: TicketService,
    private userService: UserService,
    private staffService: StaffService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private errorService: ErrorService,
    private authService: AuthService,
    private solutionService: SolutionService,
    private commentService: CommentService,
    private sanitizer: DomSanitizer,
    private projectService: ProjectService
  ) {
    // Initialize dark mode detection
    this.checkDarkMode();
    
    // Get the current user role
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role?.toUpperCase() || '';
    
    // Get current user ID
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    this.currentUserId = userData?.id || null;
  }

  private darkMode = false;

  private checkDarkMode(): void {
    // Check if the user prefers dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.darkMode = true;
    }

    // Listen for changes in color scheme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.darkMode = e.matches;
    });
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }
  private subscriptions = new Subscription();
  ngOnInit() {
    // Subscribe to route parameters
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.issueId = params['id'];
        this.loadIssueDetails(this.issueId);
        this.loadTicketsForIssue(this.issueId);
      }
    });

    // Subscribe to query parameters for notification redirects
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['focusComment'] === 'true') {
        // When redirected from a comment notification, switch to comments tab
        setTimeout(() => {
          this.onTabChange('comments');
          
          // Scroll to the comment section after it's loaded
          setTimeout(() => {
            const commentSection = document.getElementById('comments-section');
            if (commentSection) {
              commentSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 500);
        }, 300);
      } else if (queryParams['focusSolution'] === 'true') {
        // When redirected from a solution notification, switch to solutions tab
        setTimeout(() => {
          this.onTabChange('solutions');
          
          // Scroll to the solutions section after it's loaded
          setTimeout(() => {
            const solutionsSection = document.getElementById('solutions-section');
            if (solutionsSection) {
              solutionsSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 500);
        }, 300);
      }
    });
  }

  
  isDeveloper(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'DEVELOPER';
  }  

  isTester(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'TESTER';
  }

   isManager(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'MANAGER';
  }

  isPartner(): boolean{
    const user = this.authService.getCurrentUser();
    return user?.role === 'PARTNER';
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
    console.log('Starting to load tickets for logId:', logId);
    this.isLoading = true;
    this.ticketLoadError = false;
  
    this.ticketService.getTicketsByLogId(logId).subscribe({
      next: (tickets) => {
        console.log('Received tickets from server:', tickets);
        this.tickets = tickets; // Keep the main list
        this.distributeTicketsToKanbanColumns(); // Distribute to Kanban columns
        
        this.tickets.forEach((ticket) => {
          if (ticket.assignedToUserId) {
            this.loadUserDetails(ticket);
          }
          this.loadSolutionForTicket(ticket);
        });
  
        this.isLoading = false;
        console.log('Final tickets array:', this.tickets);
        console.log(`Found ${tickets.length} tickets for log ID: ${logId}`);
        this.checkDeveloperPermission();
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
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
        this.kanbanColumns.forEach(col => col.tickets = []); // Clear columns on error
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
    if (this.isPartner()) {
      this.router.navigate(['dashboard', 'project-details', this.log?.projectId]);
    } else {
      this.router.navigate(['dashboard', 'issues']);
    }
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
            
            // Always update the ticket status to RESOLVED after adding a solution
            // regardless of its current status (to ensure consistent behavior)
            this.ticketService.updateTicketStatus(ticketId, Status.RESOLVED).subscribe({
              next: (updatedTicket) => {
                console.log('Ticket status updated successfully:', updatedTicket);
                
                // Find and update the ticket in the main tickets array
                const index = this.tickets.findIndex(t => t.id === ticketId);
                if (index !== -1) {
                  this.tickets[index] = updatedTicket;
                  this.tickets[index].hasSolution = true;
                  this.tickets[index].solution = solution as any;
                }
                
                // Re-distribute tickets to ensure Kanban columns are up-to-date
                this.distributeTicketsToKanbanColumns();
                
                this.snackBar.open('Solution saved and ticket resolved', 'Close', {
                  duration: 3000
                });
                
                // Refresh all data to ensure UI is consistent
                this.loadTicketsForIssue(this.issueId);
              },
              error: (statusError: any) => {
                console.error('Error updating ticket status:', statusError);
                this.snackBar.open('Solution saved but ticket status could not be updated', 'Close', {
                  duration: 3000
                });
                
                // Still refresh tickets to reflect the solution addition
                this.loadTicketsForIssue(this.issueId);
              },
              complete: () => {
                this.isLoading = false;
              }
            });
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
    return this.tickets.some(ticket => ticket.hasSolution && ticket.solution);
  }

  getSolutionsCount(): number {
    return this.tickets.filter(ticket => ticket.hasSolution && ticket.solution).length;
  }

  getTotalTicketsCount(): number {
    return this.tickets.length;
  }

  getTodoTickets(): Ticket[] {
    return this.kanbanColumns.find(col => col.id === 'todoList')?.tickets || [];
  }

  getInProgressTickets(): Ticket[] {
    return this.kanbanColumns.find(col => col.id === 'inProgressList')?.tickets || [];
  }

  getResolvedTickets(): Ticket[] {
    return this.kanbanColumns.find(col => col.id === 'resolvedList')?.tickets || [];
  }

  getDoneTickets(): Ticket[] {
    return this.kanbanColumns.find(col => col.id === 'doneList')?.tickets || [];
  }

  getMergedTickets(): Ticket[] {
    return this.kanbanColumns.find(col => col.id === 'mergedToTestList')?.tickets || [];
  }

  getTodoTicketsCount(): number {
    return this.getTodoTickets().length;
  }

  getInProgressTicketsCount(): number {
    return this.getInProgressTickets().length;
  }

  getResolvedTicketsCount(): number {
    return this.getResolvedTickets().length;
  }

  getDoneTicketsCount(): number {
    return this.getDoneTickets().length;
  }

  getMergedTicketsCount(): number {
    return this.getMergedTickets().length;
  }

 
  isStatusTransitionAllowed(currentStatus: Status, newStatus: Status): boolean {
    // Don't allow moving to the same status
    if (currentStatus === newStatus) return false;

    switch (this.userRole) {
      case 'MANAGER':
        // Managers can change to TO_DO, MERGED_TO_TEST, or DONE
        return newStatus === Status.TO_DO || newStatus === Status.MERGED_TO_TEST || newStatus === Status.DONE;

      case 'DEVELOPER':
        // Developers can change to IN_PROGRESS or RESOLVED
        return newStatus === Status.IN_PROGRESS || newStatus === Status.RESOLVED;

      case 'TESTER':
        // Testers can change to VERIFIED
        return newStatus === Status.VERIFIED;
               
      case 'ADMIN': 
        // Admins can move tickets to any status
        return true;

      default:
        // Default deny for unknown roles
        return false;
    }
  }
  
  // Get all connected drop list IDs for drag-and-drop
  getConnectedDropLists(): string[] {
    return this.kanbanColumns.map(col => col.id);
  }
  
  // Updated drop logic to use kanbanColumns and handle 5 columns
  drop(event: CdkDragDrop<Ticket[]>) {
    const previousListId = event.previousContainer.id;
    const currentListId = event.container.id;
    
    // Find the source and target columns
    const previousColumn = this.kanbanColumns.find(col => col.id === previousListId);
    const currentColumn = this.kanbanColumns.find(col => col.id === currentListId);

    if (!previousColumn || !currentColumn) {
      console.error('Could not find source or target column during drop.');
      return;
    }

    const movedTicket = previousColumn.tickets[event.previousIndex];
    const newStatus = currentColumn.status;

    // Check permissions if moving to a different column
    if (previousColumn.id !== currentColumn.id) {
       if (!this.isStatusTransitionAllowed(movedTicket.status, newStatus)) {
          this.snackBar.open(`Your role ${this.userRole} does not have permission to perform this action`, 'Close', {
              duration: 4000,
              panelClass: ['error-snackbar']
          });
          return; 
       }
    }

    // Perform the move
    if (previousColumn.id === currentColumn.id) {
      // Reordering within the same column
      moveItemInArray(currentColumn.tickets, event.previousIndex, event.currentIndex);
      // Optionally: call backend to save order if needed
    } else {
      // Moving to a different column
      transferArrayItem(
        previousColumn.tickets,
        currentColumn.tickets,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update the ticket status in the backend
      if (movedTicket && movedTicket.id) {
         movedTicket.status = newStatus; // Update status locally immediately for UI consistency
         this.updateTicketStatus(movedTicket.id, newStatus);
      }
    }
    console.log(`Moved ticket ${movedTicket.id} from ${previousListId} to ${currentListId}`);
  }

  updateTicketStatus(ticketId: number, status: Status): void {
    this.isLoading = true;

    this.ticketService.updateTicketStatus(ticketId, status).subscribe({
      next: (updatedTicket) => {
        // Find and update the ticket in the main 'tickets' array
        const index = this.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
          this.tickets[index] = updatedTicket;
        }
        
        // Re-distribute tickets to ensure columns are up-to-date after backend confirmation
        this.distributeTicketsToKanbanColumns();

        this.snackBar.open(`Ticket #${ticketId} status updated to ${status}`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.isLoading = false;
      },
      error: (error) => {
       // ... (rest of the error handling)
       
        // Revert local changes and refresh from server on error
        this.snackBar.open(`Failed to update ticket #${ticketId} status. Reverting change.`, 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        this.loadTicketsForIssue(this.issueId); // Reload to get original state
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

  getSolutionContent(ticket: Ticket): string | null {
    if (!ticket || !ticket.solution) return null;
    
    const solution = ticket.solution as unknown as ServiceSolution;
    // Try content first, then fall back to description
    return solution.content || solution.title || null;
  }
  
  getSolutionProperty(ticket: Ticket, property: keyof ServiceSolution): any {
    if (!ticket || !ticket.solution) return null;
    
    const solution = ticket.solution as unknown as ServiceSolution;
    return solution[property];
  }

  getComplexityClass(ticket: Ticket): any {
    if (!ticket || !ticket.solution) return {};
    
    const solution = ticket.solution as unknown as ServiceSolution;
    const complexity = solution.complexity;
    
    return {
      'text-green-600 dark:text-green-400': complexity === ComplexityLevel.LOW,
      'text-yellow-600 dark:text-yellow-400': complexity === ComplexityLevel.MEDIUM,
      'text-orange-600 dark:text-orange-400': complexity === ComplexityLevel.HIGH,
      'text-red-600 dark:text-red-400': complexity === ComplexityLevel.VERY_HIGH
    };
  }

  isIssueHandled(): boolean {
    if (!this.tickets || this.tickets.length === 0) {
      return this.log?.handled || false;
    }
    return this.hasSolutions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  // Add this new method to handle tab changes
  onSolutionsTabChange(newTab: 'my-solutions' | 'developer-solutions' | 'ai-solutions'): void {
    console.log('Solutions tab changed to:', newTab);
    this.activeSolutionsTab = newTab;
    
    if (newTab === 'developer-solutions') {
      console.log('Loading developer solutions...');
      // Get stack trace from the log
      const stackTrace = this.log?.stackTrace || '';
     
      console.log('Using stack trace:', stackTrace);
      
      if (stackTrace) {
      
        this.getSolutionRecommendations(stackTrace);
      } else {
        console.warn('No stack trace available');
        this.errorMessage = 'No stack trace available to analyze';
      }
    }
  }

  getSolutionRecommendations(logMessage: string): void {
    console.log('Starting getSolutionRecommendations with log message:', logMessage);
    this.isLoading = true;
    this.errorMessage = null;
    
    // Make sure we have a log message
    if (!logMessage) {
      console.warn('No log message provided');
      this.errorMessage = 'No log message available to analyze';
      this.isLoading = false;
      return;
    }
    const request: LogAnalysisRequest = {
      logMessage: logMessage
    };
    
    console.log('Sending request to solution service:', request);
    
    const subscription = this.solutionService.getRecommendations(request)
      .subscribe({
        next: (response) => {
          console.log('Received raw response from API:', response);
          this.isLoading = false;
          
          if (response.similar_logs && response.similar_logs.length > 0) {
            console.log('Found similar logs:', response.similar_logs);
            
            // Filter out solutions that belong to the current issue
            const currentTicketIds = this.tickets.map(t => t.id);
            const filteredLogs = response.similar_logs.filter((log: any) => {
              const logTicketId = log.ticket_id;
              console.log(`Checking log with ticket_id ${logTicketId} against current tickets:`, currentTicketIds);
              return !currentTicketIds.includes(logTicketId);
            });
            
            if (filteredLogs.length === 0) {
              this.developerSolutions = [];
              this.errorMessage = 'No external solutions found for this issue';
              return;
            }
            
            // Process and map the logs to developer solutions
            this.developerSolutions = [];
            
            filteredLogs.forEach((log: any) => {
              const solution: ExtendedDeveloperSolution = {
                id: log.log_id || log.ticket_id || 0,
                source: 'Log Database',
                author: log.solution_author_user_id,
                title: log.solution_title || 'Similar Error',
                content: log.solution_content || 'No solution content available',
                code: this.extractCodeFromSolution(log.solution_content) || '',
                votes: 0,
                commentCount: 0,
                url: '',
                postedDate: new Date(),
                sourceIcon: this.getSourceIconFromTypes(log.detected_types || []),
                similarity: log.similarity || log.term_match || '0',
                errorType: log.error_type || '',
                detectedTypes: Array.isArray(log.detected_types) ? log.detected_types : [],
                exceptionTypes: Array.isArray(log.exception_types) ? log.exception_types : [],
                severity: log.severity || 'MEDIUM'
              };
              
              this.developerSolutions.push(solution);
              
              // Fetch author name if ID is available
              if (log.solution_author_user_id && typeof log.solution_author_user_id === 'number') {
                  this.userService.getUserById(log.solution_author_user_id.toString()).subscribe({
                  next: (user) => {
                    // Update the solution with author name
                    const index = this.developerSolutions.findIndex(s => s.id === solution.id);
                    if (index !== -1) {
                      (this.developerSolutions[index] as ExtendedDeveloperSolution).authorName = 
                          user.email|| `User ${log.solution_author_user_id}`;
                    }
                  },
                  error: () => {
                    // Handle error - set a default author name
                    const index = this.developerSolutions.findIndex(s => s.id === solution.id);
                    if (index !== -1) {
                      (this.developerSolutions[index] as ExtendedDeveloperSolution).authorName = 
                        `Unknown (ID: ${log.solution_author_user_id})`;
                    }
                  }
                });
              }
            });
          } else {
            this.developerSolutions = [];
            this.errorMessage = 'No similar solutions found';
          }
          
          console.log(`Final developerSolutions array (${this.developerSolutions.length} items):`, this.developerSolutions);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load recommendations';
          console.error('Error getting recommendations:', error);
          if (error.error && error.error.message) {
            this.errorMessage = `Failed to load recommendations: ${error.error.message}`;
          }
        }
      });
    
    this.subscriptions.add(subscription);
 
  }

  /**
   * Extract code snippets from solution content if present
   */
  private extractCodeFromSolution(solutionContent: string | undefined): string {
    if (!solutionContent) return '';
    
    // Simple implementation: extract content between backticks or code blocks
    const codeMatch = solutionContent.match(/```[\s\S]*?```/);
    if (codeMatch) {
      return codeMatch[0].replace(/```/g, '').trim();
    }
    
    // If no code block found, look for inline code
    const inlineCodeMatches = solutionContent.match(/`[\s\S]*?`/g);
    if (inlineCodeMatches && inlineCodeMatches.length > 0) {
      return inlineCodeMatches
        .map(match => match.replace(/`/g, ''))
        .join('\n\n');
    }
    
    return '';
  }

  /**
   * Open the source URL in a new tab
   */
  openSourceUrl(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  applyAIFix(): void {
    this.snackBar.open('Fix applied successfully! The issue has been patched.', 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  exportAISolution(): void {
    this.snackBar.open('Solution exported to clipboard', 'Close', {
      duration: 3000
    });
  }

  markAsSolutionHelpful(): void {
    this.snackBar.open('Thank you for your feedback!', 'Close', {
      duration: 3000
    });
  }

  copySolutionCode(solution: DeveloperSolution | ExtendedDeveloperSolution): void {
    // In a real app, this would copy to clipboard
    this.snackBar.open('Code copied to clipboard!', 'Close', {
      duration: 3000
    });
  }

  viewMoreDeveloperSolutions(): void {
    this.snackBar.open('Loading more community solutions...', 'Close', {
      duration: 3000
    });
  }

  editSolution(ticket: Ticket): void {
    if (!ticket.solution) return;
    
    const dialogRef = this.dialog.open(SolutionDialogComponent, {
      width: '800px',
      data: {
        ticketId: ticket.id,
        existingSolution: ticket.solution
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSolutionForTicket(ticket);
      }
    });
  }

  getStackTrace(): string {
    if (!this.log?.stackTrace) return '';
    const lines = this.log.stackTrace.split('\n');
    if (!this.showFullStackTrace && lines.length > this.stackTraceLimit) {
      return lines.slice(0, this.stackTraceLimit).join('\n') + '\n...';
    }
    return this.log.stackTrace;
  }

  toggleStackTrace(): void {
    this.showFullStackTrace = !this.showFullStackTrace;
    console.log(this.log);
  }

  /** Distribute tickets to the appropriate Kanban columns */
  distributeTicketsToKanbanColumns(): void {
    // Clear existing tickets in columns
    this.kanbanColumns.forEach(column => column.tickets = []);
    
    // Get current user ID for developer filtering
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const currentUserId = userData?.id;
    
    // Assign tickets to columns based on status
    this.tickets.forEach(ticket => {
      const targetColumn = this.kanbanColumns.find(col => col.status === ticket.status);
      if (targetColumn) {
        // Special filtering for TO_DO column based on user role
        if (targetColumn.id === 'todoList') {
          // For managers: only show unassigned tickets (tickets to be assigned)
          if (this.userRole === 'MANAGER') {
            if (!ticket.assignedToUserId) {
              targetColumn.tickets.push(ticket);
            }
          }
          // For developers: only show tickets assigned to them
          else if (this.userRole === 'DEVELOPER') {
            if (ticket.assignedToUserId && currentUserId && 
                ticket.assignedToUserId.toString() === currentUserId.toString()) {
              targetColumn.tickets.push(ticket);
            }
          }
          // For other roles (testers, admins), show all tickets
          else {
            targetColumn.tickets.push(ticket);
          }
        }
        // For all other columns, add tickets normally
        else {
          targetColumn.tickets.push(ticket);
        }
      } else {
        // Fallback to 'To Do' if status doesn't match any column
        const todoColumn = this.kanbanColumns.find(col => col.id === 'todoList');
        if (todoColumn) {
          // Apply same role-based filtering for fallback
          if (this.userRole === 'MANAGER') {
            if (!ticket.assignedToUserId) {
              todoColumn.tickets.push(ticket);
            }
          } else if (this.userRole === 'DEVELOPER') {
            if (ticket.assignedToUserId && currentUserId && 
                ticket.assignedToUserId.toString() === currentUserId.toString()) {
              todoColumn.tickets.push(ticket);
            }
          } else {
            todoColumn.tickets.push(ticket);
          }
        } else {
           console.warn(`Ticket ${ticket.id} has unknown status ${ticket.status} and no 'To Do' column found.`);
        }
      }
    });
    console.log('Distributed tickets to Kanban columns:', this.kanbanColumns);
  }

  private getSourceIconFromTypes(types: string[]): string {
    if (!types || types.length === 0) return 'DB';
    
    // Map error types to appropriate icons
    if (types.some(t => t.toLowerCase().includes('database'))) return 'DB';
    if (types.some(t => t.toLowerCase().includes('api'))) return 'API';
    if (types.some(t => t.toLowerCase().includes('web'))) return 'WEB';
    if (types.some(t => t.toLowerCase().includes('security'))) return 'SEC';
    
    return 'DB'; // Default icon
  }

  /**
   * Get the first ticket ID for the comments feature 
   * (since comments are associated with tickets in the backend)
   */
  getFirstTicketId(): number | null {
    console.log('Tickets in getFirstTicketId:', this.tickets);
    
    if (!this.tickets || this.tickets.length === 0) {
      console.warn('No tickets available for comments');
      return null;
    }
    
    // Find the first ticket with an ID
    for (const ticket of this.tickets) {
      if (ticket && ticket.id) {
        console.log('Using ticket ID for comments:', ticket.id);
        return ticket.id;
      }
    }
    
    console.warn('No ticket with valid ID found');
    return null;
  }

  /**
   * Load comments for the first ticket associated with this issue
   */
  loadComments() {
    const ticketId = this.getFirstTicketId();
    if (!ticketId) {
      console.warn('No ticket available for comments. First create a ticket.');
      this.commentError = 'No ticket available to post comments. Please create a ticket first.';
      return;
    }

    console.log('Loading comments for ticket ID:', ticketId);
    this.isLoadingComments = true;
    this.commentService.getCommentsByTicketId(ticketId).subscribe({
      next: (comments) => {
        console.log('Received comments from server:', comments);
        // Process comments to build reply structure
        this.comments = this.processCommentReplies(comments);
        
        // Fetch user details for each comment
        this.comments.forEach(comment => {
          if (comment.authorUserId) {
            this.getUserDetails(comment.authorUserId);
          }
        });
        
        console.log('Processed comments:', this.comments);
        this.isLoadingComments = false;
        this.hasMoreComments = comments.length >= this.pageSize;
        this.commentError = null;
      },
      error: (error) => {
        this.isLoadingComments = false;
        this.commentError = 'Failed to load comments. Please try again.';
        console.error('Error loading comments:', error);
      }
    });
  }

  /**
   * Reload comments
   */
  refreshComments() {
    console.log('Refreshing comments');
    this.comments = []; // Clear current comments before reloading
    this.loadComments();
  }

  /**
   * Load more comments (pagination)
   */
  loadMoreComments() {
    const ticketId = this.getFirstTicketId();
    if (!ticketId) return;

    this.isLoadingMoreComments = true;
    this.currentPage++;
    
    // In a real implementation, you would pass pagination parameters
    // This is a simplified version
    this.commentService.getCommentsByTicketId(ticketId).subscribe({
      next: (newComments) => {
        this.comments = [...this.comments, ...newComments];
        this.isLoadingMoreComments = false;
        this.hasMoreComments = newComments.length >= this.pageSize;
      },
      error: (error) => {
        this.isLoadingMoreComments = false;
        console.error('Error loading more comments:', error);
      }
    });
  }

  /**
   * Add a new comment
   */
  addComment() {
    const ticketId = this.getFirstTicketId();
    if (!ticketId) {
      this.commentError = 'No ticket available to post comments. Please create a ticket first.';
      return;
    }

    if (!this.newCommentText.trim()) {
      this.commentError = 'Comment cannot be empty';
      return;
    }

    console.log('Adding new comment for ticketId:', ticketId);
    this.isSubmittingComment = true;
    this.commentError = null;

    // Extract mentioned user IDs from the comment text
    const mentionedUserIds = this.extractMentionedUserIds(this.newCommentText);
    console.log('Extracted mentioned user IDs:', mentionedUserIds);

    const commentRequest: CommentRequest = {
      ticketId: ticketId,
      content: this.newCommentText,
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined
    };

    console.log('Sending comment request:', commentRequest);

    this.commentService.createComment(commentRequest).subscribe({
      next: (response) => {
        console.log('Comment added successfully:', response);
        
        // New approach: Refresh all comments to ensure we have the latest data
        this.loadComments();
        
        // Clear the input
        this.newCommentText = ''; 
        this.isSubmittingComment = false;
        this.snackBar.open('Comment added successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.isSubmittingComment = false;
        
        // More detailed error message based on error status
        if (error.status === 401 || error.status === 403) {
          this.commentError = 'You do not have permission to add comments.';
        } else if (error.status === 404) {
          this.commentError = 'The ticket could not be found.';
        } else if (error.status === 400) {
          this.commentError = 'Invalid comment data. Please check your input.';
        } else {
          this.commentError = 'Failed to add comment. Please try again.';
        }
      }
    });
  }

 
  private extractMentionedUserIds(text: string): number[] {
    return this.projectMembers
      .filter(member => member.firstname && text.includes(`@${member.firstname}`))
      .map(member => member.id);
  }

  /**
   * Check if the current user can edit a comment
   */
  canEditComment(comment: CommentResponse): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Get current user ID from localStorage
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const userId = userData?.id;
    
    // User can edit if they are the author or an admin
    return !!userId && (comment.authorUserId === Number(userId) || currentUser.role === 'ADMIN');
  }

  /**
   * Check if the current user can delete a comment
   */
  canDeleteComment(comment: CommentResponse): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    
    // Get current user ID from localStorage
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const userId = userData?.id;
    
    // User can delete if they are the author or an admin
    return !!userId && (comment.authorUserId === Number(userId) || currentUser.role === 'ADMIN');
  }

  /**
   * Enter edit mode for a comment
   */
  editComment(comment: CommentResponse) {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.content;
    // Set the newCommentText to enable mention functionality in edit mode
    this.newCommentText = comment.content;
  }

  /**
   * Cancel editing a comment
   */
  cancelEditOrReply() {
    this.editingCommentId = null;
    this.replyToCommentId = null;
    this.newCommentText = '';
  }

  /**
   * Save edited comment
   */
  saveEditedComment(comment: CommentResponse | number) {
    if (!this.editCommentText.trim()) {
      return;
    }

    this.isSubmittingComment = true;
    const commentId = typeof comment === 'number' ? comment : comment.id;

    // Extract mentioned user IDs from the edited comment text
    const mentionedUserIds = this.extractMentionedUserIds(this.editCommentText);

    const commentRequest: CommentRequest = {
      ticketId: this.getFirstTicketId() || 0,
      content: this.editCommentText,
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined
    };

    this.commentService.updateComment(commentId, commentRequest).subscribe({
      next: (updatedComment) => {
        // Find and update the comment in the array
        const index = this.comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
          this.comments[index] = updatedComment;
        }
        this.isSubmittingComment = false;
        this.editingCommentId = null;
        this.editCommentText = '';
        this.newCommentText = ''; // Clear newCommentText as well
        this.snackBar.open('Comment updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.isSubmittingComment = false;
        console.error('Error updating comment:', error);
        this.snackBar.open('Failed to update comment', 'Close', { duration: 3000 });
      }
    });
  }

  /**
   * Delete a comment
   */
  deleteComment(comment: CommentResponse) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.commentService.deleteComment(comment.id).subscribe({
        next: () => {
          // Remove the comment from the array
          this.comments = this.comments.filter(c => c.id !== comment.id);
          this.snackBar.open('Comment deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.snackBar.open('Failed to delete comment', 'Close', { duration: 3000 });
        }
      });
    }
  }

  /**
   * Format comment with highlighted @mentions
   */
  formatCommentWithMentions(comment: CommentResponse): SafeHtml {
    if (!comment.content) return '';
    
    let formattedContent = comment.content;
    
    // Replace @mentions with highlighted spans
    if (comment.mentionedUsers && comment.mentionedUsers.length > 0) {
      comment.mentionedUsers.forEach(user => {
        const displayName = user.name || `User ${user.id}`;
        // Match both the display format and the ID format
        const mentionRegex = new RegExp(`@${displayName}`, 'g');
        formattedContent = formattedContent.replace(mentionRegex, `<span class="mention">@${displayName}</span>`);
      });
    }
    
    // Sanitize the HTML to prevent XSS
    return this.sanitizer.bypassSecurityTrustHtml(formattedContent);
  }

  // Load comments when switching to the comments tab
  onTabChange(tab: 'details' | 'tickets' | 'solutions' | 'comments') {
    this.activeTab = tab;
    if (tab === 'comments') {
      // If tickets are not loaded yet, load them first
      if (!this.tickets || this.tickets.length === 0) {
        this.isLoading = true;
        this.loadTicketsForIssue(this.issueId);
      }
      // Load project members for mentions
      if (this.log?.projectId) {
        this.projectId = Number(this.log.projectId);
        this.loadProjectMembers();
      }
      this.loadComments();
    }
  }

  // Update loadProjectMembers to use the correct project ID
  async loadProjectMembers() {
    try {
      if (!this.projectId) {
        console.error('No project ID available');
        return;
      }
      const members = await this.projectService.getProjectMembers(this.projectId).toPromise();
      if (members) {
        this.projectMembers = members;
        console.log('Loaded project members:', members);
      }
    } catch (error) {
      console.error('Error loading project members:', error);
    }
  }

  /**
   * Start replying to a comment
   */
  replyToComment(comment: CommentResponse) {
    this.replyingToCommentId = comment.id;
    this.replyText = '';
    
    // If we were editing a comment, cancel that
    if (this.editingCommentId) {
      this.cancelEditOrReply();
    }
  }
  
  /**
   * Cancel replying to a comment
   */
  cancelReply() {
    this.replyingToCommentId = null;
    this.replyText = '';
  }
  
  /**
   * Submit a reply to a comment
   */
  submitReply(parentComment: CommentResponse) {
    if (!this.replyText.trim() || this.isSubmittingComment) {
      return;
    }
    
    const ticketId = this.getFirstTicketId();
    if (!ticketId) {
      this.commentError = 'No ticket available to post comments. Please create a ticket first.';
      return;
    }
    
    this.isSubmittingComment = true;
    
    // Extract mentioned user IDs from the reply text
    const mentionedUserIds = this.extractMentionedUserIds(this.replyText);
    
    const commentRequest: CommentRequest = {
      ticketId: ticketId,
      content: this.replyText,
      parentCommentId: parentComment.id, // Set the parent comment ID
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined
    };
    
    this.commentService.createComment(commentRequest).subscribe({
      next: (response) => {
        // Add the reply to the parent comment's replies array
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(response);
        
        // Add to parent comment map for easy lookup
        this.parentCommentMap.set(response.id, parentComment);
        
        // Reset reply state
        this.replyingToCommentId = null;
        this.replyText = '';
        this.isSubmittingComment = false;
        
        this.snackBar.open('Reply added successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.isSubmittingComment = false;
        console.error('Error adding reply:', error);
        this.snackBar.open('Failed to add reply', 'Close', { duration: 3000 });
      }
    });
  }
  
  /**
   * Get the author name of a parent comment
   */
  getParentCommentAuthor(parentCommentId: number): string {
    const parentComment = this.comments.find(c => c.id === parentCommentId);
    return parentComment?.authorUserId ? this.getUserEmail(parentComment.authorUserId) : 'Unknown User';
  }
  
  /**
   * Process comments to build reply structure and parent map
   */
  processCommentReplies(comments: CommentResponse[]): CommentResponse[] {
    // Reset the parent comment map
    this.parentCommentMap = new Map();
    
    // If comments array is empty or undefined, return empty array
    if (!comments || comments.length === 0) {
      console.log('No comments to process');
      return [];
    }
    
    console.log('Processing comment replies for', comments.length, 'comments');
    
    // Separate top-level comments and replies
    const topLevelComments: CommentResponse[] = [];
    const replies: CommentResponse[] = [];
    
    comments.forEach(comment => {
      if (comment.parentCommentId) {
        replies.push(comment);
      } else {
        comment.replies = []; // Initialize replies array
        topLevelComments.push(comment);
      }
    });
    
    // Add replies to their parent comments
    replies.forEach(reply => {
      const parentComment = topLevelComments.find(c => c.id === reply.parentCommentId);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(reply);
        this.parentCommentMap.set(reply.id, parentComment);
      } else {
        // If parent not found, treat as top-level comment
        reply.replies = [];
        topLevelComments.push(reply);
      }
    });
    
    // Set rootComments to be top-level comments
    this.rootComments = topLevelComments;
    
    return topLevelComments;
  }

  // Add missing methods for comments
  submitComment() {
    if (this.editingCommentId) {
      const commentToEdit = this.comments.find(c => c.id === this.editingCommentId);
      if (commentToEdit) {
        this.saveEditedComment(commentToEdit);
      }
    } else if (this.replyToCommentId) {
      const parentComment = this.comments.find(c => c.id === this.replyToCommentId);
      if (parentComment) {
        this.submitReply(parentComment);
      }
    } else {
      this.addComment();
    }
  }

  hasReplies(commentId: number): boolean {
    return this.comments.some(comment => comment.parentCommentId === commentId);
  }

  getRepliesForComment(commentId: number): CommentResponse[] {
    return this.comments.filter(comment => comment.parentCommentId === commentId);
  }

  // Method to get user details
  private getUserDetails(userId: number): void {
    if (this.userDetailsCache.has(userId)) return;

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.userDetailsCache.set(userId, user);
        // Trigger change detection
        this.comments = [...this.comments];
      },
      error: (error) => {
        console.error(`Error fetching user details for ID ${userId}:`, error);
        this.userDetailsCache.set(userId, { email: 'Unknown User' });
      }
    });
  }

  // Get user email from cache
  getUserEmail(userId: number): string {
    const user = this.userDetailsCache.get(userId);
    return user ? user.email : 'Loading...';
  }

  // Get total comments count including replies
  getTotalCommentsCount(): number {
    let count = 0;
    if (this.comments) {
      count = this.comments.length;
      this.comments.forEach(comment => {
        if (comment.replies) {
          count += comment.replies.length;
        }
      });
    }
    return count;
  }

  // Handle input for mentions
  handleInput(event: any, isEdit: boolean = false) {
    const textarea = event.target;
    this.cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the last @ symbol before cursor
    const lastAtSymbol = text.lastIndexOf('@', this.cursorPosition - 1);
    
    if (lastAtSymbol !== -1 && this.cursorPosition > lastAtSymbol) {
      const searchText = text.substring(lastAtSymbol + 1, this.cursorPosition).toLowerCase();
      this.mentionStart = lastAtSymbol;
      
      // Filter members based on firstname or email
      this.filteredMembers = this.projectMembers.filter(member => 
        (member.firstname && member.firstname.toLowerCase().includes(searchText)) ||
        member.email.toLowerCase().includes(searchText)
      );
      
      // Show suggestions for the appropriate textarea
      if (isEdit) {
        this.showEditCommentSuggestions = this.filteredMembers.length > 0;
        this.showNewCommentSuggestions = false;
      } else {
        this.showNewCommentSuggestions = this.filteredMembers.length > 0;
        this.showEditCommentSuggestions = false;
      }
    } else {
      this.showNewCommentSuggestions = false;
      this.showEditCommentSuggestions = false;
      this.mentionStart = -1;
    }
  }

  // Select member for mention
  selectMember(member: User, isEdit: boolean = false) {
    if (this.mentionStart !== -1) {
      const textarea = isEdit ? this.editCommentTextarea.nativeElement : this.newCommentTextarea.nativeElement;
      const text = textarea.value;
      const beforeMention = text.substring(0, this.mentionStart);
      const afterMention = text.substring(this.cursorPosition);
      
      // Insert @firstname[email]
      const displayName = member.firstname || member.email;
      const mention = `@${displayName}`;
      textarea.value = beforeMention + mention + afterMention;
      
      // Update model based on context
      if (isEdit) {
        this.editCommentText = textarea.value;
        this.showEditCommentSuggestions = false;
      } else {
        this.newCommentText = textarea.value;
        this.showNewCommentSuggestions = false;
      }
      
      // Move cursor and cleanup
      const newPosition = this.mentionStart + mention.length;
      textarea.setSelectionRange(newPosition, newPosition);
      this.mentionStart = -1;
      textarea.focus();
    }
  }
}


