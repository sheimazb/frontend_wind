import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorService } from './error.service';
import { normalizeId } from '../utils/id-helper';

// Ticket interfaces
export interface TicketData {
  title: string;
  description: string;
  assignedToUserId?: number;
  priority: Priority;
  logId: number;
  tenant?: string;
  attachments?: string[];
  status?: Status;
  creatorUserId?: number;
  userEmail?: string;
}

// Refined ticket model that matches backend DTO
export interface Ticket {
  id?: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignedToUserId?: number;
  assignedToEmail?: string;
  tenant: string;
  creatorUserId?: number;
  userEmail?: string;
  logId: number;
  projectId?: number;
  hasSolution?: boolean;
  solution?: Solution;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Solution interface
export interface Solution {
  id?: number;
  ticketId: number;
  description: string;
  codeSnippet?: string;
  resourceLinks?: string[];
  createdByUserId?: number;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Comment interface
export interface Comment {
  id?: number;
  ticketId: number;
  content: string;
  createdByUserId?: number;
  createdByEmail?: string;
  createdAt?: string;
}

// Create solution request
export interface SolutionRequest {
  ticketId: number | string;
  description: string;
  codeSnippet?: string;
  resourceLinks?: string[];
}

// Create comment request
export interface CommentRequest {
  ticketId: number | string;
  content: string;
}

// Enums to match backend
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum Status {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  VERIFIED = 'VERIFIED',
  MERGED = 'MERGED'
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/api/v1/tickets`;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {}

  /**
   * Creates a new ticket
   * @param ticketData The ticket data to create
   * @returns Observable of the created ticket
   */
  createTicket(ticketData: TicketData): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticketData).pipe(
      tap(response => console.log('Created ticket:', response)),
      catchError(error => this.errorService.handleError(error, 'Creating ticket'))
    );
  }

  /**
   * Gets tickets for the current user's tenant
   * Authorization header is automatically added by the HTTP interceptor
   * @returns Observable of all tickets for the user's tenant
   */
  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl).pipe(
      tap(tickets => console.log('Fetched all tickets:', tickets)),
      catchError(error => this.errorService.handleError(error, 'Fetching tickets'))
    );
  }

  /**
   * Gets tickets for a specific project
   * @param projectId The project ID to get tickets for
   * @returns Observable of tickets for the project
   */
  getTicketsByProjectId(projectId: string | number): Observable<Ticket[]> {
    // Ensure projectId is properly formatted
    const id = typeof projectId === 'string' ? parseInt(projectId, 10) : projectId;
    
    return this.http
      .get<Ticket[]>(`${this.apiUrl}/project/${id}`)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return of([]);
          }
          return this.errorService.handleError(error, 'Getting tickets by project ID');
        })
      );
  }

  /**
   * Gets a ticket by ID with solution information
   * @param id The ticket ID to get
   * @returns Observable of the ticket with solution info
   */
  getTicketById(id: number | string): Observable<Ticket> {
    // Normalize the ID
    const numericId = normalizeId(id);
    
    if (numericId === null) {
      console.error('Invalid ticket ID provided to getTicketById');
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    return this.http.get<Ticket>(`${this.apiUrl}/${numericId}`).pipe(
      tap(ticket => console.log('Fetched ticket:', ticket)),
      catchError(error => {
        console.error(`Error fetching ticket with ID ${numericId}:`, error);
        return this.errorService.handleError(error, 'Fetching ticket details');
      })
    );
  }

  /**
   * Gets tickets by log ID
   * @param logId The log ID to get tickets for
   * @returns Observable of tickets related to the log
   */
  getTicketsByLogId(logId: string | number): Observable<Ticket[]> {
    // The backend controller doesn't have a dedicated endpoint for filtering by logId
    // We'll fetch all tickets and filter client-side
    // This is a workaround until a proper backend endpoint is implemented
    
    return this.http
      .get<Ticket[]>(`${this.apiUrl}`)
      .pipe(
        map(tickets => tickets.filter(ticket => ticket.logId?.toString() === logId.toString())),
        catchError((error) =>
          this.errorService.handleError(error, 'Getting tickets by log ID')
        )
      );
  }

  /**
   * Gets tickets assigned to a specific user
   * @param userId The user ID to get tickets for
   * @returns Observable of tickets assigned to the user
   */
  getTicketsByAssignee(userId: string | number): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>(`${this.apiUrl}/assigned/${userId}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Getting tickets by assignee')
        )
      );
  }

  /**
   * Gets tickets created by a specific user
   * @param userId The user ID to get tickets for
   * @returns Observable of tickets created by the user
   */
  getTicketsByCreator(userId: string | number): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>(`${this.apiUrl}/created/${userId}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Getting tickets by creator')
        )
      );
  }

  /**
   * Updates a ticket
   * @param id The ticket ID to update
   * @param updates The ticket data to update
   * @returns Observable of the updated ticket
   */
  updateTicket(id: number | string, updates: Partial<Ticket>): Observable<Ticket> {
    // Normalize the ID to ensure it's a valid number
    const numericId = normalizeId(id);
    
    // Validate ID
    if (numericId === null) {
      console.error('Invalid ticket ID provided to updateTicket');
      return throwError(() => new Error('Valid ticket ID is required'));
    }

    // Log the request for debugging
    console.log(`Updating ticket ${numericId} with data:`, updates);

    // Check for tenant property which is required
    if (!updates.tenant) {
      console.warn('Tenant property is missing from update data. This may cause a server error.');
    }
    
    return this.http.put<Ticket>(`${this.apiUrl}/${numericId}`, updates).pipe(
      tap(ticket => console.log('Updated ticket success response:', ticket)),
      catchError(error => {
        console.error(`Error updating ticket ${numericId}:`, error);
        
        // Add more context to the error for better debugging
        if (error.status === 500) {
          console.error('Server error details:', {
            endpoint: `${this.apiUrl}/${numericId}`,
            method: 'PUT',
            requestBody: updates,
            error: error.error
          });
        }
        
        return this.errorService.handleError(error, 'Updating ticket');
      })
    );
  }

  /**
   * Updates a ticket
   * @param id The ticket ID to update
   * @param updates The ticket data to update
   * @returns Observable of the updated ticket
   */
  updateTicketStatus(
    ticketId: string | number,
    status: Status
  ): Observable<Ticket> { 
    // Normalize the ID to ensure it's a valid number
    const numericId = normalizeId(ticketId);
    
    // Validate ID
    if (numericId === null) {
      console.error('Invalid ticket ID provided to updateTicket status');
      return throwError(() => new Error('Valid ticket ID is required'));
    }

    // Log the request for debugging
    console.log(`Updating ticket ${numericId} with data:`, status);

    // Check for tenant property which is required
    if (!status) {
      console.warn('Status property is missing from update data. This may cause a server error.');
    }
    
    return this.http.put<Ticket>(`${this.apiUrl}/${numericId}/status`, { status }).pipe(
      tap(ticket => console.log('Updated ticket success response:', ticket)),
      catchError(error => {
        console.error(`Error updating ticket ${numericId}:`, error);
        
        // Add more context to the error for better debugging
        if (error.status === 500) {
          console.error('Server error details:', {
            endpoint: `${this.apiUrl}/${numericId}`,
            method: 'PUT',
            requestBody: status,
            error: error.error
          });
        }
        
        return this.errorService.handleError(error, 'Updating ticket status');
      })
    );
  }

  test(
    ticketId: string | number,
    status: Status
  ): Observable<Ticket> {
    // Normalize the ID
    const numericId = normalizeId(ticketId);
    
    if (numericId === null) {
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    return this.http
      .put<Ticket>(`${this.apiUrl}/${numericId}/status`, { status })
      .pipe(
        tap(ticket => console.log('Updated ticket status:', ticket)),
        catchError((error) => {
          console.error(`Error updating ticket status ${numericId}:`, error);
          return this.errorService.handleError(error, 'Updating ticket status');
        })
      );
  }

  /**
   * Assigns a ticket to a user
   * @param ticketId The ticket ID to assign
   * @param userId The user ID to assign the ticket to
   * @returns Observable of the updated ticket
   */
  assignTicket(ticketId: number | string, assignedToUserId: number): Observable<Ticket> {
    // Normalize the ticket ID
    const numericId = normalizeId(ticketId);
    
    if (numericId === null) {
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    return this.http.put<Ticket>(`${this.apiUrl}/${numericId}/assign`, { assignedToUserId }).pipe(
      tap(ticket => console.log('Assigned ticket:', ticket)),
      catchError(error => {
        console.error(`Error assigning ticket ${numericId}:`, error);
        return this.errorService.handleError(error, 'Assigning ticket');
      })
    );
  }

  /**
   * Deletes a ticket
   * @param ticketId The ticket ID to delete
   * @returns Observable of the delete operation result
   */
  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Deleted ticket:', id)),
      catchError(error => this.errorService.handleError(error, 'Deleting ticket'))
    );
  }

  /**
   * Gets the solution for a ticket
   * @param ticketId The ticket ID to get the solution for
   * @returns Observable of the ticket solution
   */
  getTicketSolution(ticketId: number): Observable<Solution> {
    return this.http.get<Solution>(`${this.apiUrl}/${ticketId}/solution`).pipe(
      tap(solution => console.log('Fetched solution:', solution)),
      catchError(error => this.errorService.handleError(error, 'Fetching ticket solution'))
    );
  }

 


  /**
   * Gets comments for a ticket
   * @param ticketId The ticket ID to get comments for
   * @returns Observable of comments for the ticket
   */
  getTicketComments(ticketId: number | string): Observable<Comment[]> {
    // Normalize the ID
    const numericId = normalizeId(ticketId);
    
    if (numericId === null) {
      console.error('Invalid ticket ID provided to getTicketComments');
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    return this.http.get<Comment[]>(`${this.apiUrl}/${numericId}/comments`).pipe(
      tap(comments => console.log(`Fetched ${comments.length} comments for ticket ${numericId}`)),
      catchError(error => {
        console.error(`Error fetching comments for ticket ${numericId}:`, error);
        return this.errorService.handleError(error, 'Fetching ticket comments');
      })
    );
  }

  /**
   * Adds a comment to a ticket
   * @param ticketId The ticket ID to add a comment to
   * @param content The comment content
   * @returns Observable of the created comment
   */
  addComment(ticketId: number | string, content: string): Observable<Comment> {
    // Validate input parameters
    if (!content || content.trim() === '') {
      return throwError(() => new Error('Comment content is required'));
    }
    
    // Normalize the ID
    const numericId = normalizeId(ticketId);
    
    if (numericId === null) {
      console.error('Invalid ticket ID provided to addComment');
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    return this.http.post<Comment>(`${this.apiUrl}/${numericId}/comments`, { content }).pipe(
      tap(comment => console.log('Added comment:', comment)),
      catchError(error => {
        console.error(`Error adding comment to ticket ${numericId}:`, error);
        return this.errorService.handleError(error, 'Adding comment');
      })
    );
  }

  /**
   * Deletes a comment
   * @param commentId The comment ID to delete
   * @returns Observable of the delete operation result
   */
  deleteComment(commentId: number | string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/comment/${commentId}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Deleting comment')
        )
      );
  }

  /**
   * Uploads attachment(s) for a ticket
   * @param ticketId The ticket ID to upload attachments for
   * @param files The files to upload
   * @returns Observable of the updated ticket with attachments
   */
  uploadAttachments(ticketId: number | string, files: File[]): Observable<Ticket> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`file${index}`, file, file.name);
    });
    
    return this.http
      .post<Ticket>(`${this.apiUrl}/${ticketId}/attachments`, formData)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Uploading attachments')
        )
      );
  }

  /**
   * Deletes an attachment
   * @param ticketId The ticket ID the attachment belongs to
   * @param attachmentUrl The URL of the attachment to delete
   * @returns Observable of the updated ticket
   */
  deleteAttachment(ticketId: number | string, attachmentUrl: string): Observable<Ticket> {
    // URL encode the attachment URL to handle special characters
    const encodedUrl = encodeURIComponent(attachmentUrl);
    
    return this.http
      .delete<Ticket>(`${this.apiUrl}/${ticketId}/attachment?url=${encodedUrl}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Deleting attachment')
        )
      );
  }

  searchTickets(params: {
    status?: Status,
    priority?: Priority,
    assignedToUserId?: number,
    creatorUserId?: number,
    searchTerm?: string
  }): Observable<Ticket[]> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<Ticket[]>(`${this.apiUrl}/search`, { params: httpParams }).pipe(
      tap(tickets => console.log('Search results:', tickets)),
      catchError(error => this.errorService.handleError(error, 'Searching tickets'))
    );
  }
}
