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
  TO_DO = 'TO_DO',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  MERGED_TO_TEST = 'MERGED_TO_TEST',
  DONE = 'DONE'
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


  createTicket(ticketData: TicketData): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticketData).pipe(
      tap(response => console.log('Created ticket:', response)),
      catchError(error => this.errorService.handleError(error, 'Creating ticket'))
    );
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl).pipe(
      tap(tickets => console.log('Fetched all tickets:', tickets)),
      catchError(error => this.errorService.handleError(error, 'Fetching tickets'))
    );
  }

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

  getTicketsByLogId(logId: string | number): Observable<Ticket[]> {
    console.log('Getting tickets for logId:', logId);
    console.log('API URL:', `${this.apiUrl}`);
    
    return this.http
      .get<Ticket[]>(`${this.apiUrl}`)
      .pipe(
        tap(allTickets => {
          console.log('All tickets received:', allTickets);
          const filteredTickets = allTickets.filter(ticket => ticket.logId?.toString() === logId.toString());
          console.log('Filtered tickets:', filteredTickets);
          return filteredTickets;
        }),
        map(tickets => tickets.filter(ticket => ticket.logId?.toString() === logId.toString())),
        catchError((error) => {
          console.error('Error in getTicketsByLogId:', error);
          return this.errorService.handleError(error, 'Getting tickets by log ID');
        })
      );
  }

  getTicketsByAssignee(userId: string | number): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>(`${this.apiUrl}/assigned/${userId}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Getting tickets by assignee')
        )
      );
  }

  getTicketsByCreator(userId: string | number): Observable<Ticket[]> {
    return this.http
      .get<Ticket[]>(`${this.apiUrl}/created/${userId}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Getting tickets by creator')
        )
      );
  }

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
    console.log(`Updating ticket ${numericId} with status:`, status);

    // Create params with the status - this matches the @RequestParam in the backend
    const params = new HttpParams().set('newStatus', status);
    
    // Send the request with status as a URL parameter (not in body)
    return this.http.put<Ticket>(`${this.apiUrl}/${numericId}/status`, {}, { params }).pipe(
      tap(ticket => console.log('Updated ticket success response:', ticket)),
      catchError(error => {
        console.error(`Error updating ticket ${numericId}:`, error);
        
        // Add more context to the error for better debugging
        if (error.status === 400) {
          console.error('Bad Request details:', {
            endpoint: `${this.apiUrl}/${numericId}/status`,
            method: 'PUT',
            params: { newStatus: status },
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
    
    // Create params with the status - this matches the @RequestParam in the backend
    const params = new HttpParams().set('newStatus', status);
    
    // Use the same approach as updateTicketStatus
    return this.http
      .put<Ticket>(`${this.apiUrl}/${numericId}/status`, {}, { params })
      .pipe(
        tap(ticket => console.log('Updated ticket status:', ticket)),
        catchError((error) => {
          console.error(`Error updating ticket status ${numericId}:`, error);
          return this.errorService.handleError(error, 'Updating ticket status');
        })
      );
  }

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

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('Deleted ticket:', id)),
      catchError(error => this.errorService.handleError(error, 'Deleting ticket'))
    );
  }

  getTicketSolution(ticketId: number): Observable<Solution> {
    return this.http.get<Solution>(`${this.apiUrl}/${ticketId}/solution`).pipe(
      tap(solution => console.log('Fetched solution:', solution)),
      catchError(error => this.errorService.handleError(error, 'Fetching ticket solution'))
    );
  }

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

  deleteComment(commentId: number | string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/comment/${commentId}`)
      .pipe(
        catchError((error) =>
          this.errorService.handleError(error, 'Deleting comment')
        )
      );
  }

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

  addSolution(solution: SolutionRequest): Observable<Solution> {
    // Normalize the ID
    const numericId = normalizeId(solution.ticketId);
    
    if (numericId === null) {
      console.error('Invalid ticket ID provided to addSolution');
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    return this.http.post<Solution>(`${this.apiUrl}/${numericId}/solution`, solution).pipe(
      tap(result => console.log('Solution added successfully:', result)),
      catchError(error => {
        console.error(`Error adding solution for ticket ${numericId}:`, error);
        return this.errorService.handleError(error, 'Adding solution');
      })
    );
  }
}
