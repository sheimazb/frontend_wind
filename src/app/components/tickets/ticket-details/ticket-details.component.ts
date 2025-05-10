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
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';

import { TicketService, Ticket, Status, Priority } from '../../../services/ticket.service';
import { CommentService, CommentResponse, CommentRequest } from '../../../services/comment.service';
import { ErrorService } from '../../../services/error.service';
import { User } from '../../../models/user.model';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { finalize, map, Subject, takeUntil, catchError, of, tap } from 'rxjs';
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
    FormsModule,
    MatMenuModule,
    MatListModule
  ],
  template: `
    <div class="ticket-details-container min-h-screen bg-transparent  py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div class="max-w-5xl mx-auto">
        <!-- Header with breadcrumbs and actions -->
        <div class="mb-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div class="mb-4 sm:mb-0">
              <nav class="flex" aria-label="Breadcrumb">
                <ol class="inline-flex items-center space-x-1 md:space-x-3">
                  <li class="inline-flex items-center">
                    <a (click)="goBack()" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white cursor-pointer">
                      <mat-icon class="mr-2 text-gray-500">dashboard</mat-icon>
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <div class="flex items-center">
                      <mat-icon class="text-gray-400 mx-1">chevron_right</mat-icon>
                      <a (click)="goBack()" class="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white cursor-pointer">
                        Tickets
                      </a>
                    </div>
                  </li>
                  <li aria-current="page">
                    <div class="flex items-center">
                      <mat-icon class="text-gray-400 mx-1">chevron_right</mat-icon>
                      <span class="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {{ ticket?.title || 'Ticket Details' }}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>
            
            <div *ngIf="ticket" class="flex flex-wrap gap-3">
              <!-- Edit Ticket Button -->
              <button 
                (click)="editMode = !editMode" 
                class="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
                [class.bg-indigo-100]="editMode"
                [class.text-indigo-700]="editMode">
                <mat-icon [class.text-indigo-600]="editMode" class="mr-1.5 text-gray-500">{{editMode ? 'close' : 'edit'}}</mat-icon>
                {{editMode ? 'Cancel Edit' : 'Edit Ticket'}}
              </button>
              
              <!-- Delete Ticket Button -->
              <button 
                (click)="deleteTicket()" 
                *ngIf="!editMode"
                class="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm">
                <mat-icon class="mr-1.5 text-gray-500 group-hover:text-red-500">delete</mat-icon>
                Delete Ticket
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div *ngIf="isLoading" class="flex justify-center my-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <ng-container *ngIf="!isLoading && ticket">
          <!-- Ticket Card with Status Banner -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
            <div class="relative">
              <!-- Status Banner -->
              <div [ngClass]="{
                'bg-orange-100 dark:bg-orange-900': ticket.status === Status.TO_DO,
                'bg-blue-100 dark:bg-blue-900': ticket.status === Status.IN_PROGRESS,
                'bg-green-100 dark:bg-green-900': ticket.status === Status.RESOLVED,
                'bg-purple-100 dark:bg-purple-900': ticket.status === Status.DONE,
                'bg-indigo-100 dark:bg-indigo-900': ticket.status === Status.MERGED_TO_TEST
              }" class="py-2 px-4">
                <div class="flex justify-between items-center">
                  <div class="flex items-center space-x-2">
                    <mat-icon [ngClass]="{
                      'text-orange-600 dark:text-orange-300': ticket.status === Status.TO_DO,
                      'text-blue-600 dark:text-blue-300': ticket.status === Status.IN_PROGRESS,
                      'text-green-600 dark:text-green-300': ticket.status === Status.RESOLVED,
                      'text-purple-600 dark:text-purple-300': ticket.status === Status.DONE,
                      'text-indigo-600 dark:text-indigo-300': ticket.status === Status.MERGED_TO_TEST
                    }">{{ getStatusIcon(ticket.status) }}</mat-icon>
                    <span [ngClass]="{
                      'text-orange-800 dark:text-orange-200': ticket.status === Status.TO_DO,
                      'text-blue-800 dark:text-blue-200': ticket.status === Status.IN_PROGRESS,
                      'text-green-800 dark:text-green-200': ticket.status === Status.RESOLVED,
                      'text-purple-800 dark:text-purple-200': ticket.status === Status.DONE,
                      'text-indigo-800 dark:text-indigo-200': ticket.status === Status.MERGED_TO_TEST
                    }" class="font-medium">{{ ticket.status }}</span>
                  </div>
                  
                  <div [ngClass]="{
                    'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200': ticket.priority === Priority.LOW,
                    'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200': ticket.priority === Priority.MEDIUM,
                    'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200': ticket.priority === Priority.HIGH,
                    'bg-red-500 text-white': ticket.priority === Priority.CRITICAL
                  }" class="px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <mat-icon class="text-xs mr-1">{{ getPriorityIcon(ticket.priority) }}</mat-icon>
                    {{ ticket.priority }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <mat-card *ngIf="ticket" class="ticket-card rounded-lg shadow-md overflow-hidden mb-6 bg-white">
            <mat-card-content>
              <!-- Ticket Content -->
              <div class="p-6">
                <!-- View Mode -->
                <div *ngIf="!editMode" class="space-y-8">
                  <!-- Title and Description -->
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{{ ticket.title }}</h1>
                    <div class="bg-gray-50 dark:bg-gray-850 p-4 rounded-lg">
                      <h2 class="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h2>
                      <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{{ ticket.description }}</p>
                    </div>
                  </div>
                  
                  <!-- Meta Info Cards -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div class="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-1">Created by</div>
                      <div class="flex items-center space-x-2">
                        <mat-icon class="text-indigo-500">person</mat-icon>
                        <span class="text-gray-900 dark:text-white">{{ ticket.userEmail || 'Unknown' }}</span>
                      </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div class="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned to</div>
                      <div class="flex items-center space-x-2">
                        <mat-icon class="text-indigo-500">person</mat-icon>
                        <span class="text-gray-900 dark:text-white">{{ getAssignedUserEmail() }}</span>
                      </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div class="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-1">Created</div>
                      <div class="flex items-center space-x-2">
                        <mat-icon class="text-indigo-500">event</mat-icon>
                        <span class="text-gray-900 dark:text-white">{{ ticket.createdAt | date:'medium' }}</span>
                      </div>
                    </div>
                    
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div class="text-sm uppercase font-medium text-gray-500 dark:text-gray-400 mb-1">Updated</div>
                      <div class="flex items-center space-x-2">
                        <mat-icon class="text-indigo-500">update</mat-icon>
                        <span class="text-gray-900 dark:text-white">{{ ticket.updatedAt | date:'medium' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Edit Mode -->
                <form *ngIf="editMode" [formGroup]="ticketForm" (ngSubmit)="updateTicket()" class="space-y-6">
                  <div class="space-y-6">
                    <!-- Title Field -->
                    <div>
                      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title<span class="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        id="title"
                        formControlName="title" 
                        class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200" 
                        placeholder="Enter ticket title"
                      >
                      <div *ngIf="ticketForm.get('title')?.invalid && ticketForm.get('title')?.touched" class="text-red-500 text-sm mt-1">
                        Title is required
                      </div>
                    </div>
                    
                    <!-- Description Field -->
                    <div>
                      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description<span class="text-red-500">*</span></label>
                      <textarea 
                        id="description"
                        formControlName="description" 
                        rows="5" 
                        class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none transition-all duration-200" 
                        placeholder="Provide details about the issue"
                      ></textarea>
                      <div *ngIf="ticketForm.get('description')?.invalid && ticketForm.get('description')?.touched" class="text-red-500 text-sm mt-1">
                        Description is required
                      </div>
                    </div>
                    
                    <!-- Status and Priority in a grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <div class="relative rounded-md shadow-sm">
                          <select 
                            id="status" 
                            formControlName="status"
                            class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white appearance-none transition-all duration-200"
                          >
                            <option *ngFor="let status of ticketStatuses" [value]="status">
                              {{ status }}
                            </option>
                          </select>
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                            <mat-icon>keyboard_arrow_down</mat-icon>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                        <div class="relative rounded-md shadow-sm">
                          <select 
                            id="priority" 
                            formControlName="priority"
                            class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white appearance-none transition-all duration-200"
                          >
                            <option *ngFor="let priority of ticketPriorities" [value]="priority">
                              {{ priority }}
                            </option>
                          </select>
                          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                            <mat-icon>keyboard_arrow_down</mat-icon>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Assignee Field -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span class="flex items-center">
                          <mat-icon class="text-indigo-500 mr-1 text-base">people</mat-icon>
                          Assign to Staff Member
                        </span>
                      </label>
                      <div class="relative" (clickOutside)="assigneeDropdownOpen = false">
                        <div 
                          class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-white cursor-pointer flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-650"
                          (click)="toggleAssigneeDropdown($event)"
                          tabindex="0"
                        >
                          <div class="flex items-center">
                            <span *ngIf="!ticketForm.get('assignedToUserId')?.value" class="text-gray-500 dark:text-gray-400 flex items-center">
                              <mat-icon class="text-gray-400 mr-2">account_circle</mat-icon>
                              Select a staff member
                            </span>
                            <span *ngIf="ticketForm.get('assignedToUserId')?.value" class="text-gray-900 dark:text-white flex items-center">
                              <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 mr-2">
                                {{ getAssignedUserInitials() }}
                              </div>
                              {{ getAssignedUserEmail() }}
                            </span>
                          </div>
                          <mat-icon class="text-gray-400 transition-transform duration-200" [class.rotate-180]="assigneeDropdownOpen">keyboard_arrow_down</mat-icon>
                        </div>
                        
                        <div *ngIf="assigneeDropdownOpen" 
                          class="absolute z-50 mb-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 text-base overflow-visible focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-700 animate-fadeIn"
                          style="max-height: 300px; overflow-y: auto; transform: translateY(-100%); bottom: 100%; left: 0; right: 0;"
                        >
                          <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
                            <div class="relative">
                              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <mat-icon class="text-gray-400">search</mat-icon>
                              </div>
                              <input 
                                type="text" 
                                class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
                                placeholder="Search staff members..."
                                [(ngModel)]="assigneeSearchTerm"
                                [ngModelOptions]="{standalone: true}"
                                (input)="filterStaffMembers(); $event.stopPropagation()"
                                (click)="$event.stopPropagation()"
                                (keydown)="$event.stopPropagation()"
                                (keydown.escape)="closeDropdown(); $event.stopPropagation()"
                              >
                            </div>
                          </div>
                          
                          <div class="overflow-y-auto" style="max-height: 200px;">
                            <div 
                              *ngFor="let member of filteredStaffMembers" 
                              class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center"
                              [class.bg-indigo-50]="ticketForm.get('assignedToUserId')?.value === member.id"
                              [class.dark:bg-indigo-900]="ticketForm.get('assignedToUserId')?.value === member.id"
                              [class.border-l-4]="ticketForm.get('assignedToUserId')?.value === member.id"
                              [class.border-indigo-500]="ticketForm.get('assignedToUserId')?.value === member.id" 
                              (click)="selectAssignee(member.id); $event.stopPropagation()"
                            >
                              <div class="flex items-center">
                                <div class="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium"
                                    [ngClass]="member.isCurrentUser ? 'bg-green-600' : 'bg-indigo-600'">
                                  {{ member.firstname ? member.firstname.charAt(0) : (member.email ? member.email.charAt(0).toUpperCase() : 'U') }}
                                </div>
                                <div class="ml-3">
                                  <div class="font-medium text-gray-900 dark:text-white truncate max-w-xs">{{ member.email }}</div>
                                  <div class="flex items-center text-xs">
                                    <span class="text-gray-500 dark:text-gray-400">{{ member.role || 'Staff Member' }}</span>
                                    <span *ngIf="member.isCurrentUser" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      You
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span 
                                *ngIf="ticketForm.get('assignedToUserId')?.value === member.id" 
                                class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400"
                              >
                                <mat-icon>check</mat-icon>
                              </span>
                            </div>
                            
                            <div 
                              *ngIf="filteredStaffMembers.length === 0" 
                              class="p-4 text-center text-gray-500 dark:text-gray-400 italic"
                            >
                              <mat-icon class="mx-auto mb-2">search_off</mat-icon>
                              <p>No staff members found</p>
                            </div>
                          </div>
                          
                          <div *ngIf="staffMembers.length > 0" class="border-t border-gray-200 dark:border-gray-700 py-2 px-3">
                            <button 
                              *ngIf="ticketForm.get('assignedToUserId')?.value" 
                              class="w-full text-left text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center py-1"
                              (click)="selectAssignee(null); $event.stopPropagation()"
                            >
                              <mat-icon class="mr-1 text-base">person_remove</mat-icon>
                              Unassign ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex justify-end pt-5 space-x-3">
                    <button 
                      type="button" 
                      (click)="editMode = false"
                      class="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      [disabled]="ticketForm.invalid || ticketForm.pristine || isLoading"
                      class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <mat-spinner *ngIf="isLoading" [diameter]="24" class="mr-2"></mat-spinner>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Comments Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <mat-icon class="text-indigo-500">chat</mat-icon>
                Comments
                <span *ngIf="comments.length > 0" class="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-medium rounded-full">{{comments.length}}</span>
              </h2>
            </div>
            
            <div class="p-6">
              <!-- Comment Form -->
              <div class="mb-8">
                <label for="comment" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span *ngIf="!replyingTo">Add your comment</span>
                  <span *ngIf="replyingTo" class="flex items-center gap-2">
                    Replying to <span class="text-indigo-600 dark:text-indigo-400 font-medium">{{getCommentAuthorDisplay(replyingTo)}}</span>
                    <button 
                      (click)="setReplyToComment(null)" 
                      class="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      matTooltip="Cancel reply">
                      <mat-icon>close</mat-icon>
                    </button>
                  </span>
                </label>
                
                <div class="mt-1 relative rounded-md shadow-sm">
                  <textarea 
                    id="comment"
                    [(ngModel)]="newComment" 
                    [ngModelOptions]="{standalone: true}"
                    rows="3" 
                    class="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none transition-all duration-200" 
                    placeholder="Share your thoughts or ask a question..."
                  ></textarea>
                  
                  <div class="mt-3 flex justify-end">
                    <button 
                      type="button"
                      (click)="addComment()"
                      [disabled]="!newComment.trim() || isSubmittingComment"
                      class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <mat-spinner *ngIf="isSubmittingComment" [diameter]="20" class="mr-2"></mat-spinner>
                      <mat-icon *ngIf="!isSubmittingComment" class="mr-1">send</mat-icon>
                      Submit
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Comments List -->
              <div *ngIf="comments.length > 0; else noCommentsTemplate">
                <div class="space-y-6">
                  <ng-container *ngFor="let comment of comments">
                    <!-- Primary Comments -->
                    <div *ngIf="!comment.parentCommentId" class="comment-thread">
                      <div class="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                        <div class="flex items-start space-x-3">
                          <div [ngClass]="getAvatarColor(comment)" class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium">
                            {{getCommentAuthorInitials(comment)}}
                          </div>
                          
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between">
                              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                                {{getCommentAuthorDisplay(comment)}}
                              </h3>
                              <div class="flex items-center">
                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                  {{getCommentDate(comment) | date:'MMM d, y, h:mm a'}}
                                </span>
                                
                                <button 
                                  [matMenuTriggerFor]="commentMenu" 
                                  class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                                >
                                  <mat-icon>more_vert</mat-icon>
                                </button>
                                <mat-menu #commentMenu="matMenu">
                                  <button mat-menu-item (click)="setReplyToComment(comment)">
                                    <mat-icon>reply</mat-icon>
                                    <span>Reply</span>
                                  </button>
                                </mat-menu>
                              </div>
                            </div>
                            
                            <div class="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {{comment.content}}
                            </div>
                            
                            <div class="mt-3">
                              <button 
                                (click)="setReplyToComment(comment)" 
                                class="inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                              >
                                <mat-icon class="mr-1 text-base">reply</mat-icon>
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    
                    </div>
                  </ng-container>
                </div>
              </div>
              
              <!-- No Comments Template -->
              <ng-template #noCommentsTemplate>
                <div class="py-8 text-center">
                  <div class="inline-block p-4 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-4">
                    <mat-icon class="text-indigo-600 dark:text-indigo-400" style="width: 32px; height: 32px; font-size: 32px;">chat_bubble_outline</mat-icon>
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No comments yet</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Be the first to share your thoughts on this ticket.</p>
                </div>
              </ng-template>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class TicketDetailsComponent implements OnInit, OnDestroy {
  
  ticket: Ticket | null = null;
  comments: CommentResponse[] = [];
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
  replyingTo: CommentResponse | null = null;
  Status = Status;
  Priority = Priority;
  isSubmittingComment = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService,
    private commentService: CommentService,
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
    this.isLoading = true;
    this.commentService.getCommentsByTicketId(numericId)
      .pipe(
        finalize(() => this.isLoading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (comments) => {
          this.comments = comments;
          this.cdRef.detectChanges();
        },
        error: (error) => this.errorService.handleError(error, 'Loading comments', true)
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

  private addAssignmentChangeComment(oldAssigneeId: number | null | undefined, newAssigneeId: number | null | undefined): void {
    if (!this.ticket?.id) return;
    const changeMessage = this.getAssignmentChangeMessage(oldAssigneeId, newAssigneeId);
    if (changeMessage) {
      const commentRequest: CommentRequest = {
        ticketId: this.ticket.id,
        content: changeMessage
      };
      
      this.commentService.createComment(commentRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
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
    
    this.isSubmittingComment = true;
    
    const commentRequest: CommentRequest = {
      ticketId: this.ticket.id,
      content: this.newComment,
      parentCommentId: this.replyingTo?.id
    };
    
    this.commentService.createComment(commentRequest)
      .pipe(
        finalize(() => {
          this.isSubmittingComment = false;
          this.cdRef.detectChanges();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (newComment) => {
          // Refresh comments list instead of manually updating the array
          if (this.ticket?.id) {
            this.loadComments(this.ticket.id);
          }
          this.newComment = '';
          this.replyingTo = null;
          this.snackBar.open('Comment added successfully', 'Close', { 
            duration: 3000, 
            panelClass: ['success-snackbar'] 
          });
        },
        error: (error) => {
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

  selectAssignee(userId: number | null) {
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

  getAssignedUserInitials(): string {
    if (!this.ticket?.assignedToUserId) return 'U';
    const ticket = this.ticket!;
    
    // Try to find the user in staff members
    const assignedUser = this.staffMembers.find(user => user.id === ticket.assignedToUserId);
    
    if (assignedUser) {
      // If we have first and last name
      if (assignedUser.firstname && assignedUser.lastname) {
        return (assignedUser.firstname.charAt(0) + assignedUser.lastname.charAt(0)).toUpperCase();
      }
      
      // If we have email, use first character
      if (assignedUser.email) {
        const parts = assignedUser.email.split('@')[0].split('.');
        if (parts.length > 1) {
          return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return assignedUser.email.charAt(0).toUpperCase();
      }
    }
    
    // Fallback to ticket assignedToEmail
    if (ticket.assignedToEmail) {
      const emailParts = ticket.assignedToEmail.split('@')[0].split('.');
      if (emailParts.length > 1) {
        return (emailParts[0].charAt(0) + emailParts[1].charAt(0)).toUpperCase();
      }
      return ticket.assignedToEmail.charAt(0).toUpperCase();
    }
    
    // Final fallback
    return 'U';
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

  setReplyToComment(comment: CommentResponse | null) {
    this.replyingTo = comment;
    if (comment) {
      const textarea = document.getElementById('comment') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }
  }
  
  getCommentAuthorDisplay(comment: CommentResponse): string {
    if (comment.mentionedUsers && comment.mentionedUsers.length > 0) {
      const author = comment.mentionedUsers.find(user => user.id === comment.authorUserId);
      if (author) {
        return author.name || author.email;
      }
    }
    return 'Unknown User';
  }
  
  getCommentAuthorInitials(comment: CommentResponse): string {
    const authorName = this.getCommentAuthorDisplay(comment);
    if (authorName === 'Unknown User') return 'U';
    
    const parts = authorName.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return authorName.substring(0, 1).toUpperCase();
  }
  
  getCommentDate(comment: CommentResponse): Date {
    return new Date(comment.createdAt);
  }
  
  getAvatarColor(comment: CommentResponse): string {
    // Generate a consistent color based on the author ID
    const colors = [
      'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-yellow-600',
       'bg-indigo-600', 'bg-pink-600', 'bg-teal-600'
    ];
    
    const index = comment.authorUserId % colors.length;
    return colors[index];
  }
}