import { Component, Inject, OnInit, ElementRef, HostListener, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Log } from '../../../models/log.model';
import { User } from '../../../models/user.model';
import { ProjectService } from '../../../services/project.service';
import { ErrorService } from '../../../services/error.service';
import { TicketData, Priority, Status, TicketService } from '../../../services/ticket.service';
import { UserService } from '../../../services/user.service';
import { Subject } from 'rxjs';
import { map, finalize, takeUntil } from 'rxjs/operators';

// More strongly typed interface for user data from localStorage
interface StoredUserData {
  id: string | number;
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  tenant?: string;
}

interface AssigneeOption {
  id: string;
  name: string;
  role: string;
  isCurrentUser: boolean;
}

@Component({
  selector: 'app-create-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './create-ticket-dialog.component.html',
  styleUrls: ['./create-ticket-dialog.component.css']
})
export class CreateTicketDialogComponent implements OnInit, OnDestroy {
  @ViewChild('assigneeDropdown') assigneeDropdown!: ElementRef;
  
  ticketData: TicketData = {
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    assignedToUserId: undefined,
    logId: 0,
    tenant: undefined,
    status: Status.TO_DO
  };

  // Make enums available to template
  Priority = Priority;
  Status = Status;
  
  assignees: { id: number; name: string; role: string; isCurrentUser: boolean }[] = [];
  loadingAssignees = false;
  dropdownOpen = false;
  activeIndex = -1;
  formSubmitted = false;
  private destroy$ = new Subject<void>();
  
  currentUserId: string | null = null;
  currentUserData: StoredUserData | null = null;
  

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CreateTicketDialogComponent>,
    private ticketService: TicketService,
    private projectService: ProjectService,
    private userService: UserService,
    private errorService: ErrorService
  ) {
    this.loadCurrentUser();
  }

  ngOnInit(): void {
    if (this.data?.log) {
      // Initialize ticket data with log information
      this.ticketData = {
        title: `Issue with Log #${this.data.log.id}`,
        description: this.generateDescription(this.data.log),
        priority: this.getPriorityFromSeverity(this.data.log.severity),
        logId: Number(this.data.log.id),
        tenant: this.currentUserData?.tenant,
        assignedToUserId: undefined, // Will be set when user selects an assignee
        status: Status.TO_DO
      };
    }

    if (this.data?.projectId) {
      this.loadProjectMembers(this.data.projectId);
    }

    // Handle clicks outside dropdown
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  private generateDescription(log: any): string {
    return `Log Details:
- ID: ${log.id}
- Type: ${log.type}
- Severity: ${log.severity}
- Message: ${log.message}
- Timestamp: ${new Date(log.timestamp).toLocaleString()}`;
  }

  private loadProjectMembers(projectId: string | number) {
    if (!projectId) {
      console.warn('No project ID provided for loading members');
      this.loadingAssignees = false;
      return;
    }

    this.loadingAssignees = true;
    const numericProjectId = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    
    this.projectService.getProjectMembers(numericProjectId)
      .pipe(
        map(members => members.map(member => ({
          id: member.id,
          name: `${member.firstname} ${member.lastname}`,
          role: member.role,
          isCurrentUser: this.currentUserId ? member.id === parseInt(this.currentUserId, 10) : false
        }))),
        finalize(() => this.loadingAssignees = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (members) => {
          this.assignees = members;
          // Pre-select current user if they're a member
          const currentUser = members.find(m => m.isCurrentUser);
          if (currentUser) {
            this.selectAssignee(currentUser.id);
          }
        },
        error: (error) => {
          console.error('Failed to load project members:', error);
          this.errorService.handleError(error, 'Loading project members');
          this.assignees = [];
        }
      });
  }

  selectAssignee(id: number) {
    if (!id) {
      console.warn('Invalid assignee ID');
      return;
    }
    this.ticketData.assignedToUserId = id;
    this.dropdownOpen = false;
    this.activeIndex = this.assignees.findIndex(a => a.id === id);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      const assignedId = String(this.ticketData.assignedToUserId);
      if (assignedId) {
        this.activeIndex = this.assignees.findIndex(a => String(a.id) === assignedId);
      }
    }
  }

  onDropdownKeydown(event: KeyboardEvent) {
    if (!this.dropdownOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.assignees.length - 1);
        this.scrollToOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        this.scrollToOption();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.activeIndex >= 0) {
          this.selectAssignee(this.assignees[this.activeIndex].id);
        }
        break;
      case 'Escape':
        this.dropdownOpen = false;
        break;
    }
  }

  private scrollToOption() {
    if (this.activeIndex >= 0) {
      const option = document.getElementById(`assignee-option-${this.activeIndex}`);
      option?.scrollIntoView({ block: 'nearest' });
    }
  }

  private handleClickOutside(event: MouseEvent) {
    if (
      this.dropdownOpen &&
      this.assigneeDropdown &&
      !this.assigneeDropdown.nativeElement.contains(event.target)
    ) {
      this.dropdownOpen = false;
    }
  }

  getSelectedAssigneeName(): string {
    const assignee = this.assignees.find(a => a.id === this.ticketData.assignedToUserId);
    return assignee ? `${assignee.name}${assignee.isCurrentUser ? ' (me)' : ''}` : '';
  }

  getSelectedAssigneeRole(): string {
    const assignee = this.assignees.find(a => a.id === this.ticketData.assignedToUserId);
    return assignee?.role || '';
  }

  getFieldValidationClass(value: any): string {
    if (!this.formSubmitted) return 'border-gray-300 dark:border-gray-600';
    return value
      ? 'border-green-500 dark:border-green-500'
      : 'border-red-500 dark:border-red-500';
  }

  isFormValid(): boolean {
    return !!(
      this.ticketData.title &&
      this.ticketData.description &&
      this.ticketData.assignedToUserId &&
      this.ticketData.priority &&
      this.ticketData.logId
    );
  }

  onSubmit() {
    this.formSubmitted = true;
    
    console.log('Form submitted. Current ticketData:', this.ticketData);
    
    if (!this.isFormValid()) {
      console.log('Form validation failed. Missing required fields.');
      this.errorService.handleGenericError('Please fill in all required fields', 'Form Validation', true);
      return;
    }

    // Create a clean ticket data object
    const ticketData: TicketData = {
      title: this.ticketData.title?.trim() || '',
      description: this.ticketData.description?.trim() || '',
      priority: this.ticketData.priority,
      assignedToUserId: this.ticketData.assignedToUserId,
      logId: Number(this.ticketData.logId),
      tenant: this.currentUserData?.tenant,
      status: Status.TO_DO,
      creatorUserId: this.currentUserId ? Number(this.currentUserId) : undefined,
      userEmail: this.currentUserData?.email
    };

    // Log the clean ticket data before closing dialog
    console.log('Clean ticket data before dialog close:', ticketData);

    this.dialogRef.close(ticketData);
  }

  onCancel() {
    this.dialogRef.close();
  }

  private getPriorityFromSeverity(severity: string): Priority {
    const severityUpper = severity.toUpperCase();
    switch (severityUpper) {
      case 'HIGH':
        return Priority.HIGH;
      case 'MEDIUM':
        return Priority.MEDIUM;
      case 'LOW':
        return Priority.LOW;
      case 'CRITICAL':
        return Priority.CRITICAL;
      default:
        return Priority.MEDIUM;
    }
  }

  /**
   * Load current user data from localStorage with proper error handling
   */
  private loadCurrentUser(): void {
    try {
      const storedUserJson = localStorage.getItem('user');
      if (storedUserJson) {
        const userData: StoredUserData = JSON.parse(storedUserJson);
        this.currentUserId = userData.id?.toString() || null;
        this.currentUserData = userData;
      }
    } catch (error) {
      // Handle JSON parsing errors gracefully
      this.errorService.handleGenericError(error, 'Loading user data', false);
    }
  }
} 