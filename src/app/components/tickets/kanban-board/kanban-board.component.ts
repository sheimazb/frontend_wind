import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem, CdkDragEnter, CdkDragExit } from '@angular/cdk/drag-drop';
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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FullscreenService } from '../../../services/fullscreen.service';
import { TicketService, Ticket, Status, Priority } from '../../../services/ticket.service';
import { UserService } from '../../../services/user.service';
import { SolutionService, Solution, SolutionStatus, ComplexityLevel } from '../../../services/solution.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

// Define a type for tab names to avoid type errors
type TabName = 'details' | 'activity' | 'solution' | 'comments';

// Define interface for user details
interface UserDetails {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

// Define interface for Kanban cards
interface KanbanCard {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  assigneeId?: number;
  assigneeDetails?: UserDetails;
  date: string;
  status: Status;
  logId?: number;
  // Original ticket for reference
  originalTicket?: Ticket;
}

// Define column structure
interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  icon: string;
  cards: KanbanCard[];
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
  // Search filter
  searchQuery = '';
  
  // Loading state
  isLoading = false;
  
  // User role for permission checks
  userRole: string = '';
  
  // User cache to avoid multiple requests for the same user
  private userCache: Map<number, UserDetails> = new Map();
  
  // Selected card for details view
  selectedCard: KanbanCard | null = null;
  showCardDetails = false;
  activeTab: TabName = 'details';
  
  // Fullscreen mode toggle
  isFullscreenMode = false;
  
  // Important columns to show in non-fullscreen mode
  importantColumnIds = ['todo', 'in_progress', 'resolved', 'merged_to_test', 'done'];
  
  // Reference to the kanban container element
  @ViewChild('kanbanContainer', { static: false }) kanbanContainer: ElementRef | null = null;
  
  // Column definitions
  columns: KanbanColumn[] = [
    {
      id: 'todo',
      name: 'TO DO',
      color: 'green',
      icon: 'assignment',
      cards: []
    },
    {
      id: 'in_progress',
      name: 'IN PROGRESS',
      color: 'blue',
      icon: 'hourglass_empty',
      cards: []
    },
    {
      id: 'resolved',
      name: 'RESOLVED',
      color: 'blue',
      icon: 'check_circle',
      cards: []
    },
    {
      id: 'merged_to_test',
      name: 'MERGED TO TEST',
      color: 'purple',
      icon: 'merge_type',
      cards: []
    },
    {
      id: 'done',
      name: 'DONE',
      color: 'green',
      icon: 'done_all',
      cards: []
    }
  ];
  
  // Solution-related properties
  newSolutionContent: string = '';
  
  constructor(
    private fullscreenService: FullscreenService,
    private ticketService: TicketService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private solutionService: SolutionService,
    private router: Router,
    private authService: AuthService
  ) {
    // Subscribe to fullscreen changes
    this.fullscreenService.fullscreen$.subscribe(isFullscreen => {
      this.isFullscreenMode = isFullscreen;
    });
    
    // Get the current user's role
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role?.toUpperCase() || '';
  }
  
  ngOnInit(): void {
    this.loadTickets();
  }
  
  /**
   * Fetch tickets from the service and distribute to columns
   */
  loadTickets(): void {
    this.isLoading = true;
    
    // Clear existing cards
    this.columns.forEach(column => column.cards = []);
    
    this.ticketService.getAllTickets().subscribe({
      next: (tickets) => {
        console.log('Fetched tickets:', tickets);
        
        // Convert tickets to KanbanCards
        const kanbanCards = tickets.map(ticket => {
          // Create the card with basic info
          const card = this.convertTicketToKanbanCard(ticket);
          
          // If the ticket has an assignedToUserId, try to fetch user details
          if (ticket.assignedToUserId) {
            // Check if we already have this user in cache
            if (this.userCache.has(ticket.assignedToUserId)) {
              // Get from cache
              card.assigneeDetails = this.userCache.get(ticket.assignedToUserId) || undefined;
              // Use first letter of name as the assignee initial
              card.assignee = card.assigneeDetails?.name?.charAt(0) || 'U';
            } else {
              // Fetch user details from UserService if not in cache
              this.userService.getUserById(ticket.assignedToUserId).subscribe({
                next: (user) => {
                  if (user) {
                    // Create a user details object with full name and email
                    const userDetails: UserDetails = {
                      id: user.id,
                      name: `${user.firstname} ${user.lastname}`,
                      email: user.email || ticket.assignedToEmail || '',
                      avatar: user.image || ''
                    };
                    
                    // Update card with user details
                    card.assigneeDetails = userDetails;
                    // Use first letter of first name as the assignee initial
                    card.assignee = user.firstname.charAt(0);
                    
                    // Cache this information for future use
                    this.userCache.set(ticket.assignedToUserId!, userDetails);
                  }
                },
                error: (error) => {
                  console.error('Error fetching user details:', error);
                }
              });
            }
          } 
          // If the ticket has an assignedToEmail but no userId, use it directly
          else if (ticket.assignedToEmail) {
            // Create a simplified user details object
            const userDetails: UserDetails = {
              id: 0,
              name: ticket.assignedToEmail,
              email: ticket.assignedToEmail,
              avatar: ''
            };
            
            // Set the details directly
            card.assigneeDetails = userDetails;
            
            // Use the first letter of the email as the avatar initial
            card.assignee = ticket.assignedToEmail.charAt(0).toUpperCase();
          }
          
          return card;
        });
        
        // Distribute the cards to columns right away
        this.distributeCardsToColumns(kanbanCards);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching tickets:', error);
        this.isLoading = false;
        this.showNotification('Failed to load tickets. Please try again later.');
      }
    });
  }
  
  /**
   * Convert a Ticket to a KanbanCard format
   */
  private convertTicketToKanbanCard(ticket: Ticket): KanbanCard {
    // Check for assignedToUserId - this is the key to identifying assigned tickets
    const hasAssignee = !!ticket.assignedToUserId && ticket.assignedToUserId > 0;
    
    return {
      id: ticket.id || 0,
      title: ticket.title,
      description: ticket.description || '',
      priority: ticket.priority,
      // Store the assignee ID for fetching details
      assigneeId: ticket.assignedToUserId,
      // Default assignee display - use email initial if available, otherwise use U
      assignee: ticket.assignedToEmail ? ticket.assignedToEmail.charAt(0).toUpperCase() : (hasAssignee ? 'U' : 'U'), 
      date: ticket.createdAt || new Date().toISOString(),
      status: ticket.status,
      logId: ticket.logId,
      originalTicket: ticket
    };
  }
  
  /**
   * Distribute cards to appropriate columns
   */
  private distributeCardsToColumns(cards: KanbanCard[]): void {
    // First clear existing cards in all columns
    this.columns.forEach(column => column.cards = []);
    
    // Apply role-based filtering
    cards.forEach(card => {
      const columnId = this.getColumnIdForTicketStatus(card.status);
      const targetColumn = this.columns.find(col => col.id === columnId);
      
      if (targetColumn) {
        // Special filtering for TO_DO column based on user role
        if (targetColumn.id === 'todo') {
          // For managers: in TO_DO column, only show unassigned tickets (tickets to be assigned)
          if (this.userRole === 'MANAGER') {
            if (!card.assigneeId) {
              targetColumn.cards.push(card);
            }
          }
          // For developers: in TO_DO column, only show tickets assigned to them
          else if (this.userRole === 'DEVELOPER') {
            // Get current user ID from local storage to compare with assignee
            const userStr = localStorage.getItem('user');
            const userData = userStr ? JSON.parse(userStr) : null;
            const currentUserId = userData?.id;
            
            if (card.assigneeId && currentUserId && card.assigneeId.toString() === currentUserId.toString()) {
              targetColumn.cards.push(card);
            }
          }
          // For other roles (testers, admins, etc.), show all tickets
          else {
            targetColumn.cards.push(card);
          }
        }
        // For all other columns, add cards normally (without special filtering)
        else {
          targetColumn.cards.push(card);
        }
      } else {
        console.warn(`No column found for status ${card.status}, adding to TODO`);
        const todoColumn = this.columns.find(col => col.id === 'todo');
        if (todoColumn) {
          // Apply the same role-based filtering
          if (this.userRole === 'MANAGER') {
            if (!card.assigneeId) {
              todoColumn.cards.push(card);
            }
          } else if (this.userRole === 'DEVELOPER') {
            const userStr = localStorage.getItem('user');
            const userData = userStr ? JSON.parse(userStr) : null;
            const currentUserId = userData?.id;
            
            if (card.assigneeId && currentUserId && card.assigneeId.toString() === currentUserId.toString()) {
              todoColumn.cards.push(card);
            }
          } else {
            todoColumn.cards.push(card);
          }
        }
      }
    });
  }
  
  /**
   * Map ticket status to column ID
   */
  private getColumnIdForTicketStatus(status: Status): string {
    const statusToColumnMap: Record<Status, string> = {
      [Status.TO_DO]: 'todo',
      [Status.IN_PROGRESS]: 'in_progress',
      [Status.RESOLVED]: 'resolved',
      [Status.MERGED_TO_TEST]: 'merged_to_test',
      [Status.DONE]: 'done'
    };
    
    return statusToColumnMap[status] || 'todo';
  }
  
  /**
   * Get user details by ID
   */
  getUserDetails(userId: number): UserDetails | null {
    return this.userCache.get(userId) || null;
  }
  onViewTicket(logId: string): void {
    this.router.navigate(['/dashboard/issues-details', logId]);
  }

  /**
   * Get status for column ID (reverse mapping)
   */
  private getStatusForColumnId(columnId: string): Status {
    const columnToStatusMap: Record<string, Status> = {
      'todo': Status.TO_DO,
      'in_progress': Status.IN_PROGRESS,
      'resolved': Status.RESOLVED,
      'merged_to_test': Status.MERGED_TO_TEST,
      'done': Status.DONE
    };
    
    return columnToStatusMap[columnId] || Status.TO_DO;
  }
  
  /**
   * Handle dropping a card into a new column
   */
  onDrop(event: CdkDragDrop<KanbanCard[]>): void {
    // Add drop sound effect (optional)
    this.playDropSound();
    
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      
      // Show a quick toast notification for same-column move
      this.showNotification('Card reordered');
    } else {
      // Moving to a different column
      // Get column names for better feedback
      const fromColumn = this.getColumnNameById(event.previousContainer.id);
      const toColumn = this.getColumnNameById(event.container.id);
      
      // Get the card being moved
      const card = event.previousContainer.data[event.previousIndex];
      
      // Get the current and new status
      const currentStatus = card.status;
      const newStatus = this.getStatusForColumnId(event.container.id);
      
      // Check if the status transition is allowed based on user role
      if (!this.isStatusTransitionAllowed(currentStatus, newStatus)) {
        this.showNotification(`Your role (${this.userRole}) cannot move tickets from ${fromColumn} to ${toColumn}`, true);
        return; // Prevent the move
      }
      
      // Update the ticket status in the backend
      if (card.originalTicket && card.originalTicket.id) {
        // Update status in the card
        card.status = newStatus;
        
        // Update in the backend
        this.updateTicketStatus(card.originalTicket.id, newStatus);
      }
      
      // Perform the actual move
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Show notification with more context
      this.showNotification(`Moved card #${card.id} from ${fromColumn} to ${toColumn}`);
    }
  }
  
  /**
   * Check if status transition is allowed based on user role
   */
  private isStatusTransitionAllowed(currentStatus: Status, newStatus: Status): boolean {
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
   * Update ticket status in the backend
   */
  private updateTicketStatus(ticketId: number, newStatus: Status): void {
    this.ticketService.updateTicketStatus(ticketId, newStatus).subscribe({
      next: (updatedTicket) => {
        console.log('Ticket status updated successfully:', updatedTicket);
      },
      error: (error) => {
        console.error('Failed to update ticket status:', error);
        this.showNotification('Failed to update ticket status. Please refresh and try again.', true);
        // Could implement a rollback of the UI change here
      }
    });
  }
  
  /**
   * Get column name by ID for better user feedback
   */
  private getColumnNameById(columnId: string): string {
    const column = this.columns.find(col => col.id === columnId);
    return column ? column.name : 'Unknown';
  }
  
  /**
   * Play a subtle sound effect on card drop (optional)
   */
  private playDropSound(): void {
    // This is optional - you can implement actual sound if desired
    // const audio = new Audio('assets/sounds/drop.mp3');
    // audio.volume = 0.2;
    // audio.play().catch(() => console.log('Audio playback prevented'));
    
    // For now we'll just log that this would play a sound
    console.log('Card dropped - sound effect would play here');
  }
  
  /**
   * Show a notification toast with optional error styling
   */
  private showNotification(message: string, isError: boolean = false): void {
    this.snackBar.open(message, 'Close', {
      duration: isError ? 4000 : 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: isError ? ['error-snackbar'] : undefined
    });
  }
  
  /**
   * Filter cards based on search query
   */
  applySearchFilter(): void {
    // Reload tickets and then filter them
    this.loadTickets();
    // You could implement a more sophisticated filtering here
    // without reloading all tickets
  }
  
  /**
   * Reset filters
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.loadTickets();
  }
  
  /**
   * Get connected drop list IDs for a column
   */
  getConnectedLists(columnId: string): string[] {
    return this.columns
      .map(col => col.id)
      .filter(id => id !== columnId);
  }
  
  /**
   * Format date string for display
   */
  formatDate(date: string): string {
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
  
  /**
   * Get CSS class for priority label
   */
  getPriorityClass(priority: string): string {
    switch (priority) {
      case Priority.HIGH:
        return 'bg-red-100 flex items-center justify-center text-red-600 mr-1 text-xs';
      case Priority.MEDIUM:
        return 'bg-yellow-100 flex items-center justify-center text-yellow-600 mr-1 text-xs';
      case Priority.LOW:
        return 'bg-green-100 flex items-center justify-center text-green-600 mr-1 text-xs';
      case Priority.CRITICAL:
        return 'bg-purple-100 flex items-center justify-center text-purple-600 mr-1 text-xs';
      default:
        return 'bg-gray-100 flex items-center justify-center text-gray-600 mr-1 text-xs';
    }
  }
  
  /**
   * Get icon or letter for priority indicator
   */
  getPriorityIcon(priority: string): string {
    switch (priority) {
      case Priority.HIGH:
        return 'H';
      case Priority.MEDIUM:
        return 'M';
      case Priority.LOW:
        return 'L';
      case Priority.CRITICAL:
        return 'C';
      default:
        return '?';
    }
  }
  
  /**
   * Select a card to view details
   */
  viewCardDetails(card: KanbanCard): void {
    this.selectedCard = card;
    this.showCardDetails = true;
    this.activeTab = 'details';
    
    // Load solution data if available
    if (card.originalTicket?.id) {
      this.loadSolutionForSelectedCard();
    }
  }
  
  /**
   * Load solution data for the selected card's ticket
   */
  loadSolutionForSelectedCard(): void {
    if (!this.selectedCard?.originalTicket?.id) return;
    
    const ticketId = this.selectedCard.originalTicket.id;
    this.solutionService.getSolutionByTicketId(ticketId).subscribe({
      next: (solution) => {
        if (solution) {
          // Update the originalTicket with the solution data
          this.selectedCard!.originalTicket!.solution = solution as any;
          this.selectedCard!.originalTicket!.hasSolution = true;
          console.log('Loaded solution for ticket:', solution);
        }
      },
      error: (error) => {
        if (error.status !== 404) {
          console.error(`Error loading solution for ticket ${ticketId}:`, error);
        }
        if (this.selectedCard?.originalTicket) {
          this.selectedCard.originalTicket.hasSolution = false;
        }
      }
    });
  }
  
  /**
   * Check if the selected card has a solution
   */
  hasSolution(): boolean {
    return !!this.selectedCard?.originalTicket?.hasSolution;
  }
  
  /**
   * Get the solution content from the selected card's ticket
   */
  getSolutionContent(): string {
    if (!this.selectedCard?.originalTicket?.solution) return 'No solution available';
    
    const solution = this.selectedCard.originalTicket.solution as unknown as Solution;
    return solution.content || solution.title || 'No description available';
  }
  
  /**
   * Get the solution complexity from the selected card's ticket
   */
  getSolutionComplexity(): string {
    if (!this.selectedCard?.originalTicket?.solution) return 'Not specified';
    
    const solution = this.selectedCard.originalTicket.solution as unknown as Solution;
    return solution.complexity || 'Not specified';
  }
  
  /**
   * Get CSS class for solution complexity level
   */
  getComplexityClass(): any {
    if (!this.selectedCard?.originalTicket?.solution) return {};
    
    const solution = this.selectedCard.originalTicket.solution as unknown as Solution;
    const complexity = solution.complexity;
    
    return {
      'text-green-600 dark:text-green-400': complexity === ComplexityLevel.LOW,
      'text-yellow-600 dark:text-yellow-400': complexity === ComplexityLevel.MEDIUM,
      'text-orange-600 dark:text-orange-400': complexity === ComplexityLevel.HIGH,
      'text-red-600 dark:text-red-400': complexity === ComplexityLevel.VERY_HIGH
    };
  }
  
  /**
   * Get the solution estimated time from the selected card's ticket
   */
  getSolutionEstimatedTime(): string {
    if (!this.selectedCard?.originalTicket?.solution) return 'Not specified';
    
    const solution = this.selectedCard.originalTicket.solution as unknown as Solution;
    return solution.estimatedTime ? `${solution.estimatedTime} mins` : 'Not specified';
  }
  
  /**
   * Get the solution status from the selected card's ticket
   */
  getSolutionStatus(): string {
    if (!this.selectedCard?.originalTicket?.solution) return 'Not specified';
    
    const solution = this.selectedCard.originalTicket.solution as unknown as Solution;
    return solution.status || SolutionStatus.DRAFT;
  }
  
  /**
   * Add to the existing solution or create a new one
   */
  addToSolution(): void {
    if (!this.selectedCard?.originalTicket?.id || !this.newSolutionContent?.trim()) {
      this.snackBar.open('Please enter some content for the solution', 'Close', {
        duration: 3000
      });
      return;
    }
    
    const ticketId = this.selectedCard.originalTicket.id;
    const existingSolution = this.selectedCard.originalTicket.solution as unknown as Solution;
    
    const solutionData: Solution = {
      ...(existingSolution?.id ? { id: existingSolution.id } : {}),
      title: existingSolution?.title || `Solution for Ticket #${ticketId}`,
      content: existingSolution ? 
        `${existingSolution.content}\n\n${this.newSolutionContent}` : this.newSolutionContent,
      ticket: { id: ticketId },
      status: SolutionStatus.SUBMITTED,
      complexity: existingSolution?.complexity || ComplexityLevel.MEDIUM,
      estimatedTime: existingSolution?.estimatedTime || 30
    };
    
    this.solutionService.saveOrUpdateSolution(solutionData).subscribe({
      next: (solution) => {
        this.snackBar.open('Solution updated successfully', 'Close', {
          duration: 3000
        });
        this.newSolutionContent = ''; // Clear the input field
        this.loadSolutionForSelectedCard(); // Reload the solution data
      },
      error: (error) => {
        console.error('Error updating solution:', error);
        this.snackBar.open('Failed to update solution', 'Close', {
          duration: 3000
        });
      }
    });
  }
  
  /**
   * Edit the existing solution with a new complexity level
   */
  updateSolutionComplexity(complexity: string): void {
    if (!this.selectedCard?.originalTicket?.id || !this.selectedCard?.originalTicket?.solution) return;
    
    const existingSolution = this.selectedCard.originalTicket.solution as unknown as Solution;
    
    const solutionData: Solution = {
      ...existingSolution,
      complexity: complexity as ComplexityLevel
    };
    
    this.solutionService.saveOrUpdateSolution(solutionData).subscribe({
      next: (solution) => {
        this.snackBar.open('Solution complexity updated', 'Close', {
          duration: 3000
        });
        this.loadSolutionForSelectedCard();
      },
      error: (error) => {
        console.error('Error updating solution complexity:', error);
        this.snackBar.open('Failed to update solution complexity', 'Close', {
          duration: 3000
        });
      }
    });
  }
  
  /**
   * Update the estimated time for the solution
   */
  updateSolutionEstimatedTime(estimatedTime: number): void {
    if (!this.selectedCard?.originalTicket?.id || !this.selectedCard?.originalTicket?.solution) return;
    
    const existingSolution = this.selectedCard.originalTicket.solution as unknown as Solution;
    
    const solutionData: Solution = {
      ...existingSolution,
      estimatedTime: estimatedTime
    };
    
    this.solutionService.saveOrUpdateSolution(solutionData).subscribe({
      next: (solution) => {
        this.snackBar.open('Solution estimated time updated', 'Close', {
          duration: 3000
        });
        this.loadSolutionForSelectedCard();
      },
      error: (error) => {
        console.error('Error updating solution estimated time:', error);
        this.snackBar.open('Failed to update solution estimated time', 'Close', {
          duration: 3000
        });
      }
    });
  }
  
  /**
   * Set the active tab in card details view
   */
  setActiveTab(tab: TabName): void {
    this.activeTab = tab;
  }
  
  /**
   * Close the details panel
   */
  closeCardDetails(): void {
    this.selectedCard = null;
    this.showCardDetails = false;
  }
  
  /**
   * Safely get ticket status
   */
  getStatusSafe(): string {
    return this.selectedCard?.status || 'Unknown';
  }
  
  /**
   * Safely get ticket priority
   */
  getPrioritySafe(): string {
    return this.selectedCard?.priority || '';
  }
  
  /**
   * Safely get ticket description
   */
  getDescriptionSafe(): string {
    return this.selectedCard?.description || '';
  }
  
  /**
   * Safely get ticket date
   */
  getDateSafe(): string {
    return this.selectedCard?.date || '';
  }
  
  /**
   * Safely get ticket assignee
   */
  getAssigneeSafe(): string {
    if (!this.selectedCard) return 'U';
    
    if (!this.selectedCard.assigneeId) {
      return 'U';
    }
    
    if (this.selectedCard.assigneeDetails) {
      return this.selectedCard.assigneeDetails.name.charAt(0).toUpperCase();
    }
    
    return 'U';
  }
  
  /**
   * Safely get ticket assignee name
   */
  getAssigneeNameSafe(): string {
    if (!this.selectedCard) return 'Unassigned';
    
    if (!this.selectedCard.assigneeId) {
      return 'Unassigned';
    }
    
    // Use details from cache if available with full name
    if (this.selectedCard.assigneeDetails?.name) {
      return this.selectedCard.assigneeDetails.name;
    }
    
    // If we have a user email in the original ticket, use that
    if (this.selectedCard.originalTicket?.assignedToEmail) {
      return this.selectedCard.originalTicket.assignedToEmail;
    }
    
    // If there's an ID but no name or email, return a default name with ID
    return `User ${this.selectedCard.assigneeId}`;
  }
  
  /**
   * Safely get ticket assignee email
   */
  getAssigneeEmailSafe(): string {
    if (!this.selectedCard) {
      return 'Unassigned';
    }
    
    if (!this.selectedCard.assigneeId) {
      return 'Unassigned';
    }
    
    // First check if we have the email in assignee details
    if (this.selectedCard.assigneeDetails?.email) {
      return this.selectedCard.assigneeDetails.email;
    }
    
    // Fall back to the original ticket's assignedToEmail if available
    if (this.selectedCard.originalTicket?.assignedToEmail) {
      return this.selectedCard.originalTicket.assignedToEmail;
    }
    
    // Last resort: show a generic user with ID
    return `User ${this.selectedCard.assigneeId}`;
  }
  
  /**
   * Safely get the initial of the assignee (from first name if available, otherwise email)
   */
  getAssigneeInitial(): string {
    if (!this.selectedCard) {
      return 'U';
    }
    
    // Get from staff member's first name if available
    if (this.selectedCard.assigneeDetails?.name) {
      // If it's a real name (contains space), use first letter of first name
      if (this.selectedCard.assigneeDetails.name.includes(' ')) {
        return this.selectedCard.assigneeDetails.name.charAt(0).toUpperCase();
      }
      // Otherwise use first letter of whatever name we have
      return this.selectedCard.assigneeDetails.name.charAt(0).toUpperCase();
    }
    
    // Get from original ticket if available
    if (this.selectedCard.originalTicket?.assignedToEmail) {
      return this.selectedCard.originalTicket.assignedToEmail.charAt(0).toUpperCase();
    }
    
    // Get from assignee field (which should be set during card creation)
    if (this.selectedCard.assignee) {
      return this.selectedCard.assignee;
    }
    
    return 'U';
  }
  
  /**
   * Safely get ticket reporter email
   */
  getReporterEmailSafe(): string {
    return this.selectedCard?.originalTicket?.userEmail || 'System';
  }
  
  /**
   * Safely get reporter initial
   */
  getReporterInitialSafe(): string {
    const email = this.selectedCard?.originalTicket?.userEmail;
    return email ? email.charAt(0).toUpperCase() : 'S';
  }
  
  /**
   * Safely get created date
   */
  getCreatedDateSafe(): string {
    return this.selectedCard?.originalTicket?.createdAt || this.selectedCard?.date || '';
  }
  
  /**
   * Safely get updated date
   */
  getUpdatedDateSafe(): string {
    return this.selectedCard?.originalTicket?.updatedAt || this.selectedCard?.date || '';
  }
  
  /**
   * Get priority class for label conditionally
   */
  getPriorityLabelClass(): string {
    if (!this.selectedCard) return '';
    
    switch (this.selectedCard.priority) {
      case Priority.LOW:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case Priority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case Priority.HIGH:
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case Priority.CRITICAL:
        return 'bg-red-600 text-white dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  }
  
  /**
   * Highlight a dropzone when a card is dragged over it
   */
  highlightDropZone(event: CdkDragEnter<KanbanCard[]>): void {
    const dropListElement = event.container.element.nativeElement;
    dropListElement.classList.add('drop-zone-highlight');
  }
  
  /**
   * Remove highlight from a dropzone when a card leaves it
   */
  removeDropZoneHighlight(event: CdkDragExit<KanbanCard[]>): void {
    const dropListElement = event.container.element.nativeElement;
    dropListElement.classList.remove('drop-zone-highlight');
  }
  
  /**
   * Toggle fullscreen mode for the kanban board
   */
  toggleFullscreenMode(): void {
    // Use our custom fallback approach
    this.isFullscreenMode = !this.isFullscreenMode;
    
    // Try to use browser fullscreen API if available
    if (this.kanbanContainer) {
      this.fullscreenService.toggleFullscreen(this.kanbanContainer.nativeElement)
        .catch(() => {
          // If browser API fails, we'll use our CSS-based fallback
          this.fullscreenService.setFullscreenState(this.isFullscreenMode);
        });
    } else {
      // Fallback to just using our custom implementation
      this.fullscreenService.setFullscreenState(this.isFullscreenMode);
    }
    
    // Show notification
    this.showNotification(this.isFullscreenMode ? 'Expanded to full view' : 'Switched to focused view');
  }
  
  /**
   * Get visible columns based on current mode
   */
  getVisibleColumns(): KanbanColumn[] {
    if (this.isFullscreenMode) {
      return this.columns;
    } else {
      return this.columns.filter(column => this.importantColumnIds.includes(column.id));
    }
  }

  /**
   * Check if the current card has an assignee
   */
  hasAssignee(): boolean {
    return !!(this.selectedCard?.assigneeId || this.selectedCard?.originalTicket?.assignedToEmail);
  }

  /**
   * Get the appropriate CSS class for the assignee avatar based on assignee ID
   */
  getAssigneeAvatarClass(): any {
    if (!this.selectedCard || !this.selectedCard.assigneeId) {
      return 'bg-gray-500';
    }
    
    // Use assigneeDetails if available
    if (this.selectedCard.assigneeDetails?.name) {
      const initial = this.selectedCard.assigneeDetails.name.charAt(0).toUpperCase();
      
      // Generate consistent color based on initial
      switch (initial) {
        case 'A': return 'bg-amber-500';
        case 'B': return 'bg-purple-500';
        case 'C': return 'bg-indigo-500';
        case 'D': return 'bg-sky-500';
        case 'E': return 'bg-blue-500';
        case 'F': return 'bg-cyan-500';
        case 'G': return 'bg-teal-500';
        case 'H': return 'bg-emerald-500';
        case 'I': return 'bg-green-500';
        case 'J': return 'bg-lime-500';
        case 'K': return 'bg-yellow-500';
        case 'L': return 'bg-amber-500';
        case 'M': return 'bg-orange-500';
        case 'N': return 'bg-red-500';
        case 'O': return 'bg-rose-500';
        case 'P': return 'bg-pink-500';
        case 'Q': return 'bg-fuchsia-500';
        case 'R': return 'bg-purple-500';
        case 'S': return 'bg-indigo-500';
        case 'T': return 'bg-blue-500';
        case 'U': return 'bg-cyan-500';
        case 'V': return 'bg-teal-500';
        case 'W': return 'bg-emerald-500';
        case 'X': return 'bg-lime-500';
        case 'Y': return 'bg-yellow-500';
        case 'Z': return 'bg-orange-500';
        default: return 'bg-gray-500';
      }
    }
    
    // If no name available, use ID to determine color
    const idLastDigit = this.selectedCard.assigneeId % 5;
    switch (idLastDigit) {
      case 0: return 'bg-blue-500';
      case 1: return 'bg-amber-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-purple-500';
      case 4: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
  
  /**
   * Safely get reporter name (extracted from email)
   */
  getReporterNameSafe(): string {
    const email = this.selectedCard?.originalTicket?.userEmail;
    if (!email) return 'System';
    
    // Try to extract name from email (assuming format: name@domain.com)
    const atIndex = email.indexOf('@');
    if (atIndex > 0) {
      const namepart = email.substring(0, atIndex);
      // Convert to Title Case if it's a simple name
      if (namepart.length <= 20) {
        // Return first letter capitalized + rest of name
        return namepart.charAt(0).toUpperCase() + namepart.slice(1);
      }
      return namepart;
    }
    
    return email;
  }
  
  /**
   * Get tooltip text for assignee avatar showing name and email if available
   */
  getAssigneeTooltip(card: KanbanCard): string {
    if (!card.assigneeId) {
      return 'Unassigned';
    }
    
    // If we have assignee details with a name and email
    if (card.assigneeDetails?.name) {
      // If name is different from email (indicating it's a real name), show both
      if (card.assigneeDetails.email && card.assigneeDetails.name !== card.assigneeDetails.email) {
        return `${card.assigneeDetails.name} (${card.assigneeDetails.email})`;
      }
      // Just return the name if that's all we have
      return card.assigneeDetails.name;
    }
    
    // If we have the original ticket with an email
    if (card.originalTicket?.assignedToEmail) {
      return card.originalTicket.assignedToEmail;
    }
    
    // If there's an ID but no other details, use a default format
    return `User ${card.assigneeId}`;
  }
  
  /**
   * Get email initial for a card avatar - prioritizes first name
   */
  getCardEmailInitial(card: KanbanCard): string {
    // Use first letter of name if available
    if (card.assigneeDetails?.name) {
      // If it contains a space (first last name format), get first letter
      if (card.assigneeDetails.name.includes(' ')) {
        return card.assigneeDetails.name.charAt(0).toUpperCase();
      }
      return card.assigneeDetails.name.charAt(0).toUpperCase();
    }
    
    // Then check original ticket for email
    if (card.originalTicket?.assignedToEmail) {
      return card.originalTicket.assignedToEmail.charAt(0).toUpperCase();
    }
    
    // Default
    return card.assignee || 'U';
  }
  
  /**
   * Get name or email address for a card
   */
  getCardEmail(card: KanbanCard): string {
    if (!card.assigneeId) {
      return 'Unassigned';
    }
    
    // First priority: show the full name if available
    if (card.assigneeDetails?.name) {
      return card.assigneeDetails.name;
    }
    
    // Second priority: show the email from the original ticket
    if (card.originalTicket?.assignedToEmail) {
      return card.originalTicket.assignedToEmail;
    }
    
    // Last resort: show a generic user with ID
    return `User ${card.assigneeId}`;
  }

  /**
   * Check if the current card has a valid assignee email different from the name
   */
  hasAssigneeEmail(): boolean {
    if (!this.selectedCard || !this.selectedCard.assigneeId) {
      return false;
    }
    
    // Get the email and name
    const email = this.getAssigneeEmailSafe();
    const name = this.getAssigneeNameSafe();
    
    // Check if it's a valid email and different from the name
    return email !== 'Unassigned' && 
           email !== name && 
           email.includes('@');
  }
}
