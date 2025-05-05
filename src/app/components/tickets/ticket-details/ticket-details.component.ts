import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TicketService, Ticket, Status, Priority, Comment, Solution } from '../../../services/ticket.service';
import { ErrorService } from '../../../services/error.service';
import { User } from '../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { finalize, map, Subject, takeUntil } from 'rxjs';
import { LogService } from '../../../services/log.service';
import { normalizeId } from '../../../utils/id-helper';

interface StaffMember {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  role?: string;
  isCurrentUser?: boolean;
}

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatBadgeModule,
    MatAutocompleteModule,
    FormsModule
  ],
  template: `
    <div class="ticket-details-container px-6 py-8 max-w-6xl mx-auto font-roboto">
      <div class="header-actions flex justify-between items-center mb-6 bg-blue-100 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        <button mat-button (click)="goBack()" class="text-indigo-600 dark:text-indigo-400 transition-all duration-300">
          <mat-icon>arrow_back</mat-icon>
          Back to Tickets
        </button>
        <div class="flex gap-3" *ngIf="ticket">
          <!-- Edit Ticket Button -->
          <button 
            (click)="editMode = !editMode" 
            class="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 border border-green-500 rounded-full flex items-center justify-center gap-2 hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
            <mat-icon>{{editMode ? 'close' : 'edit'}}</mat-icon>
            <span class="text-sm md:text-base font-bree">{{editMode ? 'Cancel Edit' : 'Edit Ticket'}}</span>
          </button>
          
          <!-- Delete Ticket Button -->
          <button 
            (click)="deleteTicket()" 
            *ngIf="!editMode" 
            class="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 border border-orange-600 rounded-full flex items-center justify-center gap-2 hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
            <mat-icon>delete</mat-icon>
            <span class="text-sm md:text-base font-bree">Delete Ticket</span>
          </button>
        </div>
      </div>

      <mat-card *ngIf="ticket" class="ticket-card rounded-lg shadow-md overflow-hidden mb-6 bg-white">
        <mat-card-content>
          <!-- Edit Mode -->
          <form *ngIf="editMode" [formGroup]="ticketForm" (ngSubmit)="updateTicket()" class="px-4 py-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Edit Ticket</h2>
              </div>
              
              <div class="p-6 space-y-5">
                <!-- Title Field -->
                <div class="form-group">
                  <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title<span class="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    id="title"
                    formControlName="title" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                    placeholder="Enter ticket title"
                  >
                  <div *ngIf="ticketForm.get('title')?.invalid && ticketForm.get('title')?.touched" class="text-red-500 text-sm mt-1">
                    Title is required
                  </div>
                </div>
                
                <!-- Description Field -->
                <div class="form-group">
                  <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description<span class="text-red-500">*</span></label>
                  <textarea 
                    id="description"
                    formControlName="description" 
                    rows="5" 
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none" 
                    placeholder="Provide details about the issue"
                  ></textarea>
                  <div *ngIf="ticketForm.get('description')?.invalid && ticketForm.get('description')?.touched" class="text-red-500 text-sm mt-1">
                    Description is required
                  </div>
                </div>
                
                <!-- Status and Priority in a grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div class="form-group">
                    <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <div class="relative">
                      <select 
                        id="status" 
                        formControlName="status"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none pr-10"
                      >
                        <option *ngFor="let status of ticketStatuses" [value]="status">
                          {{ status }}
                        </option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <mat-icon>arrow_drop_down</mat-icon>
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <div class="relative">
                      <select 
                        id="priority" 
                        formControlName="priority"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none pr-10"
                      >
                        <option *ngFor="let priority of ticketPriorities" [value]="priority">
                          {{ priority }}
                        </option>
                      </select>
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <mat-icon>arrow_drop_down</mat-icon>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Assignee Field -->
                <div class="form-group mb-8">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Staff Member</label>
                  <div class="relative z-50">
                    <div 
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white flex items-center justify-between cursor-pointer"
                      (click)="toggleAssigneeDropdown($event)"
                      tabindex="0"
                    >
                      <span *ngIf="!ticketForm.get('assignedToUserId')?.value" class="text-gray-500 dark:text-gray-400">Select a staff member</span>
                      <span *ngIf="ticketForm.get('assignedToUserId')?.value" class="text-gray-900 dark:text-white">
                        {{ getAssignedUserEmail() }}
                      </span>
                      <span 
                        class="text-gray-400 flex items-center justify-center w-8 h-8 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                        (click)="toggleAssigneeDropdown($event)"
                      >
                        <mat-icon>{{ assigneeDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down' }}</mat-icon>
                      </span>
                    </div>
                    
                    <div *ngIf="assigneeDropdownOpen" class="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg rounded-md z-[9999] overflow-visible">
                      <div class="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <input 
                          type="text" 
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Search staff members..."
                          [(ngModel)]="assigneeSearchTerm"
                          [ngModelOptions]="{standalone: true}"
                          (input)="filterStaffMembers(); $event.stopPropagation()"
                          (click)="$event.stopPropagation()"
                          (keydown)="$event.stopPropagation()"
                          (keydown.escape)="closeDropdown(); $event.stopPropagation()"
                          (keydown.enter)="$event.stopPropagation()">
                      </div>
                      
                      <div class="max-h-60 min-h-[100px] overflow-y-auto">
                        <div 
                          *ngFor="let member of filteredStaffMembers" 
                          class="py-3 px-4 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          [class.bg-blue-50]="ticketForm.get('assignedToUserId')?.value === member.id"
                          [class.dark:bg-blue-900]="ticketForm.get('assignedToUserId')?.value === member.id"
                          (click)="selectAssignee(member.id); $event.stopPropagation()"
                          (mousedown)="$event.stopPropagation()"
                        >
                          <div class="flex items-center">
                            <div class="flex-shrink-0 h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 mr-3">
                              {{ member.firstname ? member.firstname.charAt(0) : (member.email ? member.email.charAt(0).toUpperCase() : 'U') }}
                            </div>
                            <div>
                              <div class="font-medium">{{ member.email }}</div>
                              <div *ngIf="member.role" class="text-xs text-gray-500 dark:text-gray-400">{{ member.role }}</div>
                            </div>
                          </div>
                          <span class="flex items-center">
                            <mat-icon *ngIf="ticketForm.get('assignedToUserId')?.value === member.id" class="text-blue-500">check_circle</mat-icon>
                          </span>
                        </div>
                        
                        <div 
                          *ngIf="filteredStaffMembers.length === 0" 
                          class="p-4 text-center text-gray-500 dark:text-gray-400 italic">
                          No staff members found
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button 
                  type="button" 
                  (click)="editMode = false"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  [disabled]="ticketForm.invalid || ticketForm.pristine"
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>

          <!-- View Mode -->
          <div *ngIf="!editMode" class="ticket-info p-6">
            <div class="ticket-header flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 class="ticket-title text-2xl font-medium text-gray-900">{{ticket.title}}</h2>
              <div class="ticket-meta flex gap-1 items-center">
                <ng-container *ngIf="ticket.status; else unknownStatus">
                  <div [ngClass]="{
                    'bg-orange-100 text-orange-900': ticket.status === Status.TO_DO,
                    'bg-green-100 text-green-900': ticket.status === Status.RESOLVED,
                    'bg-purple-100 text-purple-900': ticket.status === Status.DONE
                  }" class="inline-flex items-center justify-center gap-1 px-3 py-1 text-sm font-medium rounded-full shadow-sm">
                    <mat-icon [ngClass]="{
                      'text-orange-700': ticket.status === Status.TO_DO,
                      'text-green-700': ticket.status === Status.RESOLVED,
                      'text-purple-700': ticket.status === Status.DONE
                    }" class="text-base">{{ getStatusIcon(ticket.status) }}</mat-icon>
                    <span>{{ticket.status}}</span>
                  </div>
                </ng-container>

                <ng-template #unknownStatus>
                  <div class="inline-flex items-center justify-center gap-1 px-3 py-1 text-sm font-medium rounded-full shadow-sm bg-gray-200 text-gray-600">
                    <mat-icon class="text-base text-gray-500">help_outline</mat-icon>
                    <span>Unknown</span>
                  </div>
                </ng-template>

                <ng-container *ngIf="ticket.priority; else unknownPriority">
                  <div [ngClass]="{
                    'bg-green-100 text-green-900': ticket.priority === Priority.LOW,
                    'bg-orange-100 text-orange-900': ticket.priority === Priority.MEDIUM,
                    'bg-red-100 text-red-900': ticket.priority === Priority.HIGH,
                    'bg-red-800 text-white': ticket.priority === Priority.CRITICAL
                  }" class="inline-flex items-center justify-center gap-1 px-3 py-1 text-sm font-medium rounded-full shadow-sm">
                    <mat-icon [ngClass]="{
                      'text-green-700': ticket.priority === Priority.LOW,
                      'text-orange-700': ticket.priority === Priority.MEDIUM,
                      'text-red-700': ticket.priority === Priority.HIGH,
                      'text-white': ticket.priority === Priority.CRITICAL
                    }" class="text-base">{{ getPriorityIcon(ticket.priority) }}</mat-icon>
                    <span>{{ticket.priority}}</span>
                  </div>
                </ng-container>

                <ng-template #unknownPriority>
                  <div class="inline-flex items-center justify-center gap-1 px-3 py-1 text-sm font-medium rounded-full shadow-sm bg-gray-200 text-gray-600">
                    <mat-icon class="text-base text-gray-500">help_outline</mat-icon>
                    <span>Unknown</span>
                  </div>
                </ng-template>
              </div>
            </div>

            <mat-divider class="my-6"></mat-divider>

            <div class="ticket-details">
              <div class="description-container bg-gray-50 p-4 rounded-lg mb-6">
                <h3 class="text-base font-medium text-gray-600 mb-3">Description</h3>
                <p class="description whitespace-pre-line text-gray-700 leading-relaxed">{{ticket.description}}</p>
              </div>

              <div class="meta-info grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="meta-card bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div class="meta-header flex items-center gap-2 mb-3 text-indigo-600 font-medium">
                    <mat-icon>person</mat-icon>
                    <span>Created by</span>
                  </div>
                  <div class="meta-content text-gray-700 text-sm">{{ticket.userEmail || 'Unknown'}}</div>
                </div>

                <div class="meta-card bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div class="meta-header flex items-center gap-2 mb-3 text-indigo-600 font-medium">
                    <mat-icon>person</mat-icon>
                    <span>Assigned to</span>
                  </div>
                  <div class="meta-content text-gray-700 text-sm">{{getAssignedUserEmail()}}</div>
                </div>

                <div class="meta-card bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div class="meta-header flex items-center gap-2 mb-3 text-indigo-600 font-medium">
                    <mat-icon>event</mat-icon>
                    <span>Created</span>
                  </div>
                  <div class="meta-content text-gray-700 text-sm">{{ticket.createdAt | date:'medium'}}</div>
                </div>

                <div class="meta-card bg-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div class="meta-header flex items-center gap-2 mb-3 text-indigo-600 font-medium">
                    <mat-icon>update</mat-icon>
                    <span>Last updated</span>
                  </div>
                  <div class="meta-content text-gray-700 text-sm">{{ticket.updatedAt | date:'medium'}}</div>
                </div>
              </div>
            </div>

            <mat-divider class="my-6"></mat-divider>

            <!-- Comments Section -->
            <div class="comments-section mt-8 pt-6 border-t border-gray-200">
              <h3 class="flex items-center gap-2 text-lg font-medium text-gray-700 mb-4">
                <mat-icon>comment</mat-icon>
                Comments
                <span *ngIf="comments.length > 0" class="text-indigo-600 text-sm">({{comments.length}})</span>
              </h3>

              <div class="form-group mt-6">
                <label for="comment" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Comment</label>
                <div class="flex">
                  <textarea 
                    id="comment"
                    [(ngModel)]="newComment" 
                    [ngModelOptions]="{standalone: true}"
                    rows="2" 
                    class="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none" 
                    placeholder="Type your comment here..."
                  ></textarea>
                  <button 
                    type="button"
                    (click)="addComment()"
                    [disabled]="!newComment.trim()"
                    class="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
              </div>

              <div class="comments-list mt-4 flex flex-col gap-4" *ngIf="comments.length > 0; else noCommentsTemplate">
                <mat-card *ngFor="let comment of comments" class="bg-gray-50 border-l-4 border-indigo-600">
                  <mat-card-content>
                    <p class="mb-3 leading-relaxed">{{comment.content}}</p>
                    <div class="flex items-center gap-2 text-gray-600 text-xs">
                      <mat-icon class="text-indigo-600 text-base">account_circle</mat-icon>
                      <small>By {{comment.createdByEmail || 'Unknown'}} on {{comment.createdAt | date:'medium'}}</small>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <ng-template #noCommentsTemplate>
                <div class="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p>No comments yet. Be the first to add a comment.</p>
                </div>
              </ng-template>
            </div>

            <!-- Solution Section -->
            <div class="solution-section mt-8 pt-6 border-t border-gray-200" *ngIf="ticket?.status === Status.RESOLVED || ticket?.status === Status.DONE">
              <h3 class="flex items-center gap-2 text-lg font-medium text-gray-700 mb-4">
                <mat-icon>lightbulb</mat-icon> 
                Solution
              </h3>

              <div *ngIf="solution; else noSolution" class="mt-4">
                <mat-card class="bg-green-50 border-l-4 border-green-600">
                  <mat-card-content>
                    <h4 class="text-base font-medium text-green-800 mb-2">Resolution Details</h4>
                    <p class="mb-4">{{solution.description}}</p>

                    <div *ngIf="solution.codeSnippet" class="mb-4">
                      <h4 class="text-base font-medium text-green-800 mb-2">Code Solution</h4>
                      <pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono">{{solution.codeSnippet}}</pre>
                    </div>

                    <div *ngIf="solution.resourceLinks?.length">
                      <h4 class="text-base font-medium text-green-800 mb-2">Resources</h4>
                      <ul class="list-none p-0 m-0">
                        <li *ngFor="let link of solution.resourceLinks" class="mb-2">
                          <a [href]="link" target="_blank" class="flex items-center gap-2 text-blue-600 hover:text-indigo-600 transition-colors">
                            <mat-icon>link</mat-icon>
                            {{link}}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <ng-template #noSolution>
                <div class="flex flex-col items-center p-8 text-gray-600 text-center">
                  <mat-icon class="text-5xl mb-4 text-gray-400">engineering</mat-icon>
                  <p>No solution has been added yet.</p>
                </div>
              </ng-template>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class TicketDetailsComponent implements OnInit, OnDestroy {
  
  ticket: Ticket | null = null;
  comments: Comment[] = [];
  solution: Solution | null = null;
  isLoading = true;
  editMode = false;
  ticketForm: FormGroup;
  commentForm: FormGroup;
  ticketStatuses = Object.values(Status);
  ticketPriorities = Object.values(Priority);
  staffMembers: StaffMember[] = [];
  filteredStaffMembers: StaffMember[] = [];
  dropdownOpen = false;
  assigneeDropdownOpen = false;
  assigneeSearchTerm = '';
  selectedAssigneeId: number | null = null;
  private destroy$ = new Subject<void>();
  currentUserId: string | null = null;
  newComment = '';
  Status = Status;
  Priority = Priority;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private errorService: ErrorService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private projectService: ProjectService,
    private logService: LogService,
    private cdRef: ChangeDetectorRef
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      status: [Status.TO_DO, Validators.required],
      priority: [Priority.MEDIUM, Validators.required],
      assignedToUserId: [null]
    });

    this.commentForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTicket(id);
      const user = localStorage.getItem('user');
      if (user) {
        this.currentUserId = JSON.parse(user).id;
      }
    }
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.assignee-display') && !target.closest('.assignee-input-container')) {
      this.assigneeDropdownOpen = false;
    }
  }

  loadStaffMembers() {
    if (this.ticket?.projectId) {
      this.loadProjectMembers(Number(this.ticket.projectId));
    } else if (this.ticket?.logId) {
      this.isLoading = true;
      this.logService.getLogById(this.ticket.logId.toString())
        .pipe(
          finalize(() => this.isLoading = false),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (log) => {
            if (log && log.projectId) {
              this.loadProjectMembers(Number(log.projectId));
            } else {
              this.handleNoProjectId();
            }
          },
          error: (error) => {
            this.handleNoProjectId();
          }
        });
    } else {
      this.handleNoProjectId();
    }
  }

  private handleNoProjectId() {
    this.snackBar.open('Could not load team members - no project associated with this ticket.', 'Close', {
      duration: 5000,
      panelClass: ['warning-snackbar']
    });
    this.staffMembers = [];
    this.filteredStaffMembers = [];
  }

  loadProjectMembers(projectId: number) {
    this.isLoading = true;
    this.projectService.getProjectMembers(projectId)
      .pipe(
        map(members => members.map(member => ({
          id: member.id,
          email: member.email || `${member.firstname} ${member.lastname}`,
          firstname: member.firstname,
          lastname: member.lastname,
          role: member.role,
          isCurrentUser: this.currentUserId ? member.id === parseInt(this.currentUserId, 10) : false
        } as StaffMember))),
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (members) => {
          this.staffMembers = members;
          this.filteredStaffMembers = [...members];
        },
        error: (error) => {
          this.errorService.handleError(error, 'Loading project members', true);
          this.staffMembers = [];
          this.filteredStaffMembers = [];
        }
      });
  }

  loadTicket(id: number | string) {
    this.isLoading = true;
    const numericId = normalizeId(id);
    if (numericId === null) {
      this.snackBar.open('Invalid ticket ID', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      this.isLoading = false;
      this.router.navigate(['/tickets']);
      return;
    }
    this.ticketService.getTicketById(numericId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.setupForm();
        this.loadStaffMembers();
        if (ticket.id) {
          this.loadComments(ticket.id);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorService.handleError(error, 'Loading ticket details', true);
        this.isLoading = false;
        if (error.status === 404) {
          this.router.navigate(['/tickets']);
        }
      }
    });
  }

  loadComments(ticketId: number | string) {
    const numericId = normalizeId(ticketId);
    if (numericId === null) return;
    this.ticketService.getTicketComments(numericId).subscribe({
      next: (comments) => this.comments = comments,
      error: (error) => this.errorService.handleError(error, 'Loading comments', true)
    });
  }

  loadSolution(ticketId: number) {
    this.ticketService.getTicketSolution(ticketId).subscribe({
      next: (solution) => this.solution = solution,
      error: (error) => this.errorService.handleError(error, 'Loading solution', true)
    });
  }

  updateTicket() {
    if (this.ticketForm.invalid) {
      Object.keys(this.ticketForm.controls).forEach(key => {
        const control = this.ticketForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    this.isLoading = true;
    const originalAssigneeId = this.ticket?.assignedToUserId;
    const newAssigneeId = this.ticketForm.get('assignedToUserId')?.value;
    if (!this.ticket?.id) {
      this.snackBar.open('Cannot update ticket: Missing ticket ID', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      this.isLoading = false;
      return;
    }
    const ticketId = typeof this.ticket.id === 'string' ? parseInt(this.ticket.id, 10) : this.ticket.id;
    const updateData: Partial<Ticket> = {
      title: this.ticketForm.get('title')?.value,
      description: this.ticketForm.get('description')?.value,
      status: this.ticketForm.get('status')?.value,
      priority: this.ticketForm.get('priority')?.value,
      tenant: this.ticket.tenant
    };
    if (originalAssigneeId !== newAssigneeId) {
      updateData.assignedToUserId = newAssigneeId || null;
    }
    this.ticketService.updateTicket(ticketId, updateData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (updatedTicket) => {
          this.ticket = updatedTicket;
          this.editMode = false;
          if (originalAssigneeId !== newAssigneeId && this.ticket?.id) {
            this.addAssignmentChangeComment(originalAssigneeId, newAssigneeId);
          }
          this.snackBar.open('Ticket updated successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        },
        error: (error) => this.errorService.handleError(error, 'Updating ticket', true)
      });
  }

  private addAssignmentChangeComment(oldAssigneeId: number | null | undefined, newAssigneeId: number | null | undefined) {
    if (!this.ticket?.id) return;
    const changeMessage = this.getAssignmentChangeMessage(oldAssigneeId, newAssigneeId);
    if (changeMessage) {
      this.ticketService.addComment(this.ticket.id, changeMessage).subscribe({
        next: (comment) => {
          if (this.ticket?.id) this.loadComments(this.ticket.id);
        },
        error: (error) => {}
      });
    }
  }

  getAssignmentChangeMessage(oldAssigneeId: number | null | undefined, newAssigneeId: number | null | undefined): string | null {
    if ((oldAssigneeId === newAssigneeId) || (oldAssigneeId == null && newAssigneeId == null)) return null;
    if (oldAssigneeId == null && newAssigneeId != null) return 'Ticket assigned successfully';
    if (oldAssigneeId != null && newAssigneeId == null) return 'Ticket unassigned';
    return 'Ticket reassigned to a different user';
  }

  addComment() {
    if (!this.ticket?.id || !this.newComment.trim()) return;
    this.isLoading = true;
    this.ticketService.addComment(this.ticket.id, this.newComment).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newComment = '';
        this.isLoading = false;
        this.snackBar.open('Comment added successfully', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorService.handleError(error, 'Adding comment', true);
      }
    });
  }

  deleteTicket() {
    if (!this.ticket) return;
    if (confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      this.ticketService.deleteTicket(this.ticket.id!).subscribe({
        next: () => {
          this.snackBar.open('Ticket deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/tickets']);
        },
        error: (error) => this.errorService.handleError(error, 'Deleting ticket', true)
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/issues-details/', this.ticket?.logId]);
  }

  filterStaffMembers() {
    if (!this.assigneeSearchTerm) {
      this.filteredStaffMembers = [...this.staffMembers];
      return;
    }
    const term = this.assigneeSearchTerm.toLowerCase();
    this.filteredStaffMembers = this.staffMembers.filter(member => {
      const emailMatch = member.email?.toLowerCase().includes(term) || false;
      const nameMatch = `${member.firstname || ''} ${member.lastname || ''}`.toLowerCase().includes(term);
      return emailMatch || nameMatch;
    });
  }

  toggleAssigneeDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.assigneeDropdownOpen = !this.assigneeDropdownOpen;
    if (this.assigneeDropdownOpen) {
      this.assigneeSearchTerm = '';
      this.filteredStaffMembers = [...this.staffMembers];
      this.cdRef.detectChanges();
      setTimeout(() => {
        document.addEventListener('click', this.closeDropdownOnClickOutside);
        const searchInput = document.querySelector('input[placeholder="Search staff members..."]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }, 0);
    } else {
      document.removeEventListener('click', this.closeDropdownOnClickOutside);
    }
    this.cdRef.detectChanges();
  }

  closeDropdownOnClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative > div[tabindex="0"]') && !target.closest('.absolute.top-full')) {
      this.assigneeDropdownOpen = false;
      document.removeEventListener('click', this.closeDropdownOnClickOutside);
      this.cdRef.detectChanges();
    }
  }

  selectAssignee(userId: number) {
    this.ticketForm.get('assignedToUserId')?.setValue(userId);
    this.ticketForm.get('assignedToUserId')?.markAsDirty();
    this.assigneeDropdownOpen = false;
    document.removeEventListener('click', this.closeDropdownOnClickOutside);
    this.cdRef.detectChanges();
  }

  getStatusIcon(status: string | null | undefined): string {
    if (!status) return 'help_outline';
    switch (status) {
      case Status.TO_DO: return 'hourglass_empty';
      case Status.IN_PROGRESS: return 'pending';
      case Status.RESOLVED: return 'check_circle';
      case Status.MERGED_TO_TEST: return 'verified';
      case Status.DONE: return 'task_alt';
      default: return 'help_outline';
    }
  }

  getPriorityIcon(priority: string | null | undefined): string {
    if (!priority) return 'help_outline';
    switch (priority) {
      case Priority.LOW: return 'arrow_downward';
      case Priority.MEDIUM: return 'remove';
      case Priority.HIGH: return 'arrow_upward';
      case Priority.CRITICAL: return 'priority_high';
      default: return 'help_outline';
    }
  }

  getAssignedUserEmail(): string {
    if (!this.ticket?.assignedToUserId) return 'Unassigned';
    const ticket = this.ticket!;
    if (ticket.assignedToEmail) return ticket.assignedToEmail;
    const assignedUser = this.staffMembers.find(user => user.id === ticket.assignedToUserId);
    return assignedUser?.email || (assignedUser?.firstname && assignedUser?.lastname ? `${assignedUser.firstname} ${assignedUser.lastname}` : `User ${ticket.assignedToUserId}`);
  }

  setupForm() {
    if (!this.ticket) return;
    this.ticketForm = this.fb.group({
      title: [this.ticket.title, Validators.required],
      description: [this.ticket.description, Validators.required],
      status: [this.ticket.status, Validators.required],
      priority: [this.ticket.priority, Validators.required],
      assignedToUserId: [this.ticket.assignedToUserId]
    });
  }

  closeDropdown(): void {
    this.assigneeDropdownOpen = false;
    document.removeEventListener('click', this.closeDropdownOnClickOutside);
    this.cdRef.detectChanges();
  }
}