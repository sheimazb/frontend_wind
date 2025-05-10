import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';

import { TicketService, Ticket, Status, Priority } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { ErrorService } from '../../../services/error.service';

// Define interface for Kanban columns
interface IssueTicketsKanbanColumn {
  id: string;
  name: string;
  status: Status;
  color: string;
  icon: string;
  tickets: Ticket[];
}

@Component({
  selector: 'app-issue-tickets',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    DragDropModule,
    RouterModule
  ],
  templateUrl: './issue-tickets.component.html',
  styleUrl: './issue-tickets.component.css'
})
export class IssueTicketsComponent implements OnInit {
  @Input() issueId: string = '';
  @Input() projectId?: number;
  @Output() ticketCreated = new EventEmitter<void>();
  
  Status = Status;
  Priority = Priority;
  
  tickets: Ticket[] = [];
  isLoading: boolean = false;
  ticketLoadError: boolean = false;
  ticketsViewMode: 'list' | 'kanban' = 'kanban';
  
  // Role information
  userRole: string = '';
  
  // Define columns for the Kanban view
  kanbanColumns: IssueTicketsKanbanColumn[] = [
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
      id: 'doneList',
      name: 'Done',
      status: Status.DONE,
      color: 'teal',
      icon: 'done_all',
      tickets: []
    }
  ];

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private errorService: ErrorService
  ) {
    // Get the current user role
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role?.toUpperCase() || '';
  }

  ngOnInit(): void {
    if (this.issueId) {
      this.loadTicketsForIssue(this.issueId);
    }
  }

  /**
   * Load tickets for the current issue
   */
  loadTicketsForIssue(logId: string): void {
    this.isLoading = true;
    this.ticketLoadError = false;
  
    this.ticketService.getTicketsByLogId(logId).subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.distributeTicketsToKanbanColumns();
        
        // Load additional ticket details
        this.tickets.forEach((ticket) => {
          if (ticket.assignedToUserId) {
            this.loadUserDetails(ticket);
          }
        });
  
        this.isLoading = false;
        this.checkDeveloperPermission();
      },
      error: (error) => {
        this.tickets = [];
        this.ticketLoadError = true;
        this.isLoading = false;
        
        if (error.status === 404) {
          this.loadAllTicketsAndFilterByLogId(logId);
        }
        this.kanbanColumns.forEach(col => col.tickets = []);
      },
    });
  }
  
  /**
   * Fallback method to get tickets if the by-logId endpoint fails
   */
  loadAllTicketsAndFilterByLogId(logId: string): void {
    this.ticketService.getAllTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets.filter((t) => t.logId?.toString() === logId);
        this.distributeTicketsToKanbanColumns();
        this.isLoading = false;
        this.ticketLoadError = false;
        
        this.checkDeveloperPermission();
      },
      error: (error) => {
        this.tickets = [];
        this.ticketLoadError = true;
        this.isLoading = false;
      },
    });
  }
  
  /**
   * Create a new ticket
   */
  createTicket(): void {
    // Emit event to parent component to open ticket creation dialog
    this.ticketCreated.emit();
  }

  /**
   * Get all connected drop list IDs for drag-and-drop
   */
  getConnectedDropLists(): string[] {
    return this.kanbanColumns.map(col => col.id);
  }
  
  /**
   * Handle ticket drop between columns
   */
  drop(event: CdkDragDrop<Ticket[]>): void {
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
          this.snackBar.open(`Your role (${this.userRole}) cannot move tickets from ${movedTicket.status} to ${newStatus}`, 'Close', {
              duration: 4000,
              panelClass: ['error-snackbar']
          });
          return; // Prevent the move
       }
    }

    // Perform the move
    if (previousColumn.id === currentColumn.id) {
      // Reordering within the same column
      moveItemInArray(currentColumn.tickets, event.previousIndex, event.currentIndex);
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
  }

  /**
   * Update ticket status
   */
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
        this.errorService.handleError(error, 'Updating ticket status', true);
       
        // Revert local changes and refresh from server on error
        this.snackBar.open(`Failed to update ticket #${ticketId} status. Reverting change.`, 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        this.loadTicketsForIssue(this.issueId);
        this.isLoading = false;
      }
    });
  }

  /**
   * Check if status transition is allowed based on user role
   */
  isStatusTransitionAllowed(currentStatus: Status, newStatus: Status): boolean {
    // Don't allow moving to the same status
    if (currentStatus === newStatus) return false;

    switch (this.userRole) {
      case 'MANAGER':
        // Managers can change to TO_DO or MERGED_TO_TEST
        return newStatus === Status.TO_DO || newStatus === Status.MERGED_TO_TEST;

      case 'DEVELOPER':
        // Developers can change to IN_PROGRESS or RESOLVED
        return newStatus === Status.IN_PROGRESS || newStatus === Status.RESOLVED;

      case 'TESTER':
        // Testers can change to DONE
        return newStatus === Status.DONE;
               
      case 'ADMIN': 
        // Admins can move tickets to any status
        return true;

      default:
        // Default deny for unknown roles
        return false;
    }
  }

  /**
   * View ticket details
   */
  viewTicketDetails(ticket: Ticket): void {
    // This will be handled by router navigation in the template
  }

  /**
   * Edit ticket
   */
  editTicket(ticket: Ticket): void {
    // This will be handled by router navigation in the template
  }

  /**
   * Calculate time to resolution
   */
  calculateTimeToResolution(createdAt: string | undefined, solvedAt: string | undefined): string {
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

  /**
   * Check developer permission
   */
  private checkDeveloperPermission(): void {
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
      // Navigation will be handled by parent component
    }
  }

  /**
   * Check if current user is a developer
   */
  isDeveloper(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'DEVELOPER';
  }

  /**
   * Check if current user is a manager
   */
  isManager(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'MANAGER';
  }

  /**
   * Load user details for a ticket
   */
  private loadUserDetails(ticket: Ticket): void {
    // This would be replaced with a real API call in a production environment
    // Simplified version without actual API call for this example
    if (ticket.assignedToUserId) {
      ticket.assignedToEmail = `User ${ticket.assignedToUserId}`;
    } else {
      ticket.assignedToEmail = 'Unassigned';
    }
  }

  /**
   * Distribute tickets to Kanban columns
   */
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
        }
      }
    });
  }

  /**
   * Helper methods for ticket counts by status
   */
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

  getTotalTicketsCount(): number {
    return this.tickets.length;
  }
} 