import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { TicketService, Ticket, TicketStatus, TicketPriority, Comment, SolutionRequest, Solution } from '../../../services/ticket.service';
import { ErrorService } from '../../../services/error.service';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './ticket-details.component.html',
  styleUrl: './ticket-details.component.css'
})
export class TicketDetailsComponent implements OnInit {
  ticketId: string | null = null;
  ticket: Ticket | null = null;
  comments: Comment[] = [];
  solution: Solution | null = null;
  isLoadingSolution = false;
  
  // New comment
  newCommentContent: string = '';
  
  // New solution
  newSolutionDescription: string = '';
  newSolutionCodeSnippet: string = '';
  newSolutionResourceLinks: string = '';
  
  // Loading states
  isLoading = true;
  isSubmittingComment = false;
  isSubmittingSolution = false;
  
  // Current user data
  currentUserId: string | null = null;
  currentUserEmail: string | null = null;
  userRole: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private errorService: ErrorService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadCurrentUser();
    
    // Get ticket ID from route
    this.route.paramMap.subscribe(params => {
      this.ticketId = params.get('id');
      if (this.ticketId) {
        this.loadTicket();
        this.loadComments();
      } else {
        this.router.navigate(['/dashboard/tickets']);
      }
    });
  }
  
  /**
   * Loads the current user data from localStorage
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
   * Loads the ticket details
   */
  loadTicket(): void {
    if (!this.ticketId) return;
    
    this.isLoading = true;
    
    this.ticketService.getTicketById(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.isLoading = false;
        
        // If ticket has solution, load it
        if (this.ticket.hasSolution && this.ticket.solutionId) {
          this.loadSolution(this.ticket.solutionId);
        }
      },
      error: (error) => {
        this.errorService.handleError(error, 'Loading ticket details', true);
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Loads the solution for the ticket
   */
  loadSolution(solutionId: string | number): void {
    this.isLoadingSolution = true;
    
    this.ticketService.getTicketSolution(solutionId).subscribe({
      next: (solution) => {
        this.solution = solution;
        this.isLoadingSolution = false;
      },
      error: (error) => {
        this.errorService.handleError(error, 'Loading solution', false);
        this.isLoadingSolution = false;
      }
    });
  }
  
  /**
   * Loads the comments for this ticket
   */
  loadComments(): void {
    if (!this.ticketId) return;
    
    this.ticketService.getTicketComments(this.ticketId).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (error) => {
        this.errorService.handleError(error, 'Loading comments', true);
      }
    });
  }
  
  /**
   * Submit a new comment
   */
  submitComment(): void {
    if (!this.ticketId || !this.newCommentContent.trim()) return;
    
    this.isSubmittingComment = true;
    
    const commentRequest = {
      ticketId: this.ticketId,
      content: this.newCommentContent
    };
    
    this.ticketService.addComment(commentRequest).subscribe({
      next: () => {
        this.snackBar.open('Comment added successfully', 'Close', { duration: 3000 });
        this.newCommentContent = '';
        this.loadComments();
        this.isSubmittingComment = false;
      },
      error: (error) => {
        this.errorService.handleError(error, 'Adding comment', true);
        this.isSubmittingComment = false;
      }
    });
  }
  
  /**
   * Delete a comment
   */
  deleteComment(commentId: string | number): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    this.ticketService.deleteComment(commentId).subscribe({
      next: () => {
        this.snackBar.open('Comment deleted successfully', 'Close', { duration: 3000 });
        this.loadComments();
      },
      error: (error) => {
        this.errorService.handleError(error, 'Deleting comment', true);
      }
    });
  }
  
  /**
   * Submit a new solution
   */
  submitSolution(): void {
    if (!this.ticketId || !this.newSolutionDescription.trim()) return;
    
    this.isSubmittingSolution = true;
    
    const solution: SolutionRequest = {
      ticketId: this.ticketId,
      description: this.newSolutionDescription,
      codeSnippet: this.newSolutionCodeSnippet || undefined,
      resourceLinks: this.newSolutionResourceLinks ? this.newSolutionResourceLinks.split(',').map(link => link.trim()) : undefined
    };
    
    this.ticketService.addSolution(solution).subscribe({
      next: (solution) => {
        this.snackBar.open('Solution added successfully', 'Close', { duration: 3000 });
        this.solution = solution;
        this.resetSolutionForm();
        this.loadTicket(); // Refresh ticket data to show the new solution
        this.isSubmittingSolution = false;
      },
      error: (error) => {
        this.errorService.handleError(error, 'Adding solution', true);
        this.isSubmittingSolution = false;
      }
    });
  }
  
  /**
   * Reset solution form
   */
  resetSolutionForm(): void {
    this.newSolutionDescription = '';
    this.newSolutionCodeSnippet = '';
    this.newSolutionResourceLinks = '';
  }
  
  /**
   * Update ticket status
   */
  updateStatus(status: TicketStatus): void {
    if (!this.ticketId || !this.ticket) return;
    
    this.ticketService.updateTicket(this.ticketId, { status }).subscribe({
      next: () => {
        this.snackBar.open(`Ticket status updated to ${status}`, 'Close', { duration: 3000 });
        this.loadTicket();
      },
      error: (error) => {
        this.errorService.handleError(error, 'Updating ticket status', true);
      }
    });
  }
  
  /**
   * Update ticket priority
   */
  updatePriority(priority: TicketPriority): void {
    if (!this.ticketId || !this.ticket) return;
    
    this.ticketService.updateTicket(this.ticketId, { priority }).subscribe({
      next: () => {
        this.snackBar.open(`Ticket priority updated to ${priority}`, 'Close', { duration: 3000 });
        this.loadTicket();
      },
      error: (error) => {
        this.errorService.handleError(error, 'Updating ticket priority', true);
      }
    });
  }
  
  /**
   * Check if the current user created this ticket
   */
  isCreatedByCurrentUser(): boolean {
    return this.ticket?.userId?.toString() === this.currentUserId;
  }
  
  /**
   * Check if the current user is assigned to this ticket
   */
  isAssignedToCurrentUser(): boolean {
    return this.ticket?.assignedToUserId?.toString() === this.currentUserId;
  }
  
  /**
   * Format a date string
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    return dateObj.toLocaleString();
  }
  
  /**
   * Get CSS class for priority
   */
  getPriorityClass(priority: TicketPriority): string {
    switch (priority) {
      case 'LOW': return 'priority-low';
      case 'MEDIUM': return 'priority-medium';
      case 'HIGH': return 'priority-high';
      case 'CRITICAL': return 'priority-critical';
      default: return '';
    }
  }
  
  /**
   * Get CSS class for status
   */
  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'RESOLVED': return 'status-resolved';
      case 'VERIFIED': return 'status-verified';
      default: return '';
    }
  }
  
  /**
   * Navigate back to tickets list
   */
  goBack(): void {
    this.router.navigate(['/dashboard/tickets']);
  }
}
