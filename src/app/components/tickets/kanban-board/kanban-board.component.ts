import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { TicketService, Ticket, Status, Priority } from '../../../services/ticket.service';
import { ErrorService } from '../../../services/error.service';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project.model';

interface KanbanColumn {
  name: string;
  status: Status;
  tickets: Ticket[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.css'
})
export class KanbanBoardComponent implements OnInit {
  // Loading state
  isLoading = false;
  error: string | null = null;
  
  // User info
  currentUserId: string | null = null;
  currentUserEmail: string | null = null;
  userRole: string | null = null;
  
  // Projects
  projects: Project[] = [];
  selectedProjectId: string = '';
  
  // Kanban columns
  columns: KanbanColumn[] = [
    { name: 'To Do', status: Status.PENDING, tickets: [] },
    { name: 'Resolved', status: Status.RESOLVED, tickets: [] },
    { name: 'Verified', status: Status.VERIFIED, tickets: [] }
  ];
  
  // Filters
  filterByAssignee = false;
  searchQuery = '';
  
  // All tickets (before filtering)
  allTickets: Ticket[] = [];
  
  constructor(
    private router: Router,
    private ticketService: TicketService,
    private projectService: ProjectService,
    private errorService: ErrorService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    console.log('Kanban Board Component Initialized');
    this.loadCurrentUser();
    this.loadProjects();
  }
  
  /**
   * Loads current user data from localStorage
   */
  loadCurrentUser(): void {
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        this.currentUserId = userData.id?.toString() || null;
        this.currentUserEmail = userData.email || null;
        this.userRole = userData.role || null;
      }
    } catch (error) {
      this.errorService.handleGenericError(error, 'Loading user data', false);
    }
  }
  
  /**
   * Loads user projects
   */
  loadProjects(): void {
    if (!this.currentUserId) {
      this.snackBar.open('Unable to determine current user', 'Close', { duration: 3000 });
      return;
    }
    
    // Convert currentUserId string to number for API call
    const userId = parseInt(this.currentUserId, 10);
    this.projectService.getUserProjects(userId).subscribe({
      next: (projects) => {
        this.projects = projects;
        
        if (this.projects.length > 0) {
          // Set first project as selected by default
          this.selectedProjectId = this.projects[0].id.toString();
          this.loadTickets(this.selectedProjectId);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorService.handleError(error, 'Loading projects', true);
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Loads tickets based on filters
   */
  loadTickets(projectId: string | number): void {
    this.isLoading = true;
    this.error = null;

    this.ticketService.getTicketsByProjectId(projectId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (tickets) => {
          this.allTickets = tickets || [];
          this.filterTickets();
        },
        error: (error) => {
          this.error = 'Failed to load tickets. Please try again.';
          this.errorService.handleError(error, 'Loading tickets');
        }
      });
  }
  
  /**
   * Filters and distributes tickets to columns
   */
  filterTickets(): void {
    // Reset columns
    this.columns.forEach(column => column.tickets = []);
    
    // Filter tickets based on search query
    let filteredTickets = this.allTickets;
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.assignedToUserId?.toString().includes(query) ||
        ticket.id?.toString().includes(query)
      );
    }
    
    // Filter by assignee if needed
    if (this.filterByAssignee && this.currentUserId) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.assignedToUserId?.toString() === this.currentUserId
      );
    }
    
    // Distribute tickets to columns based on status
    filteredTickets.forEach(ticket => {
      const column = this.columns.find(col => 
        col.status === ticket.status || 
        (col.status === Status.PENDING && !ticket.status)
      );
      if (column) {
        column.tickets.push(ticket);
      }
    });
  }
  
  /**
   * Handle dropping a ticket into a new column
   */
  onDrop(event: CdkDragDrop<Ticket[]>): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Get the ticket and update its status
      const ticket = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromColumn(event.container.id);
      
      if (ticket && newStatus && ticket.status !== newStatus) {
        this.updateTicketStatus(ticket, newStatus);
      }
    }
  }
  
  /**
   * Get status based on column ID
   */
  private getStatusFromColumn(columnId: string): Status | null {
    switch(columnId) {
      case 'todo':
        return Status.PENDING;
      case 'resolved':
        return Status.RESOLVED;
      case 'verified':
        return Status.VERIFIED;
      default:
        return null;
    }
  }
  
  /**
   * Update ticket status
   */
  updateTicketStatus(ticket: Ticket, status: Status): void {
    if (!ticket.id) return;
    
    // For tickets moved to In Progress, ensure they have an assignee
    if (status === 'PENDING' && !ticket.assignedToUserId && this.currentUserId) {
      // Assign to current user
      this.ticketService.assignTicket(ticket.id, Number(this.currentUserId)).subscribe({
        next: (updatedTicket) => {
          Object.assign(ticket, updatedTicket);
          this.snackBar.open(`Ticket assigned to you and moved to In Progress`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.errorService.handleError(error, 'Assigning ticket', true);
          this.loadTickets(this.selectedProjectId); // Reload to correct state
        }
      });
    } else {
      // Just update status
      this.ticketService.updateTicketStatus(ticket.id, status).subscribe({
        next: (updatedTicket) => {
          Object.assign(ticket, updatedTicket);
          this.snackBar.open(`Ticket status updated to ${status}`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.errorService.handleError(error, 'Updating ticket status', true);
          this.loadTickets(this.selectedProjectId); // Reload to correct state
        }
      });
    }
  }
  
  /**
   * View ticket details
   */
  viewTicket(ticketId: string | number): void {
    this.router.navigate(['/dashboard/tickets', ticketId]);
  }
  
  /**
   * Check if current user can move ticket
   */
  canMoveTicket(ticket: Ticket): boolean {
    // Managers can move any ticket
    if (this.userRole === 'MANAGER') return true;
    
    // Devs and testers can only move their assigned tickets
    return ticket.assignedToUserId?.toString() === this.currentUserId;
  }
  
  /**
   * On project change
   */
  onProjectChange(): void {
    this.loadTickets(this.selectedProjectId);
  }
  
  /**
   * Toggle assignee filter
   */
  toggleAssigneeFilter(): void {
    this.filterByAssignee = !this.filterByAssignee;
    this.filterTickets();
  }
  
  /**
   * Apply search filter
   */
  applySearchFilter(): void {
    this.filterTickets();
  }
  
  /**
   * Reset filters
   */
  resetFilters(): void {
    this.filterByAssignee = false;
    this.searchQuery = '';
    this.filterTickets();
  }
  
  /**
   * Get priority CSS class
   */
    getPriorityClass(priority: Priority): string {
    switch (priority) {
      case Priority.LOW: return 'priority-low';
      case Priority.MEDIUM: return 'priority-medium';
      case Priority.HIGH: return 'priority-high';
      case Priority.CRITICAL: return 'priority-critical';
      default: return '';
    }
  }
  
  /**
   * Format date string
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    const now = new Date();
    
    // If today, just show time
    if (dateObj.toDateString() === now.toDateString()) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show short date
    return dateObj.toLocaleDateString();
  }
}
