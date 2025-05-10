import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorService } from './error.service';
import { normalizeId } from '../utils/id-helper';


export interface CommentRequest {
  ticketId: number | string;
  content: string;
  mentionedUserIds?: number[];
  parentCommentId?: number; // Add support for replies
}


export interface CommentResponse {
  id: number;
  ticketId: number;
  content: string;
  authorUserId: number; 
  mentionedUserIds: number[];  
  mentionedUsers?: { 
    id: number;
    email: string;
    name: string;
  }[];
  parentCommentId?: number; 
  replies?: CommentResponse[]; 
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for handling comment-related API operations
 */
@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/api/v1/comments`;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {
    console.log(`CommentService initialized with API URL: ${this.apiUrl}`);
  }


  getCommentsByTicketId(ticketId: number | string): Observable<CommentResponse[]> {
    // Normalize the ID
    const normalizedId = normalizeId(ticketId);
    
    if (normalizedId === null) {
      console.error('Invalid ticket ID provided to getCommentsByTicketId:', ticketId);
      return this.errorService.handleGenericError(new Error('Valid ticket ID is required'), 'Fetching comments');
    }
    
    const url = `${this.apiUrl}/ticket/${normalizedId}`;
    console.log(`Fetching comments from: ${url}`);
    
    return this.http.get<CommentResponse[]>(url).pipe(
      tap(comments => console.log(`Fetched ${comments.length} comments for ticket ID ${normalizedId}`, comments)),
      catchError(error => {
        console.error(`Error fetching comments for ticket ${normalizedId}:`, error);
        
        // Handle common error scenarios
        if (error instanceof HttpErrorResponse && error.status === 404) {
          console.warn(`No comments found for ticket ${normalizedId} (404 Not Found)`);
          // Return empty array as an Observable instead of throwing an error for 404
          return new Observable<CommentResponse[]>(observer => {
            observer.next([]);
            observer.complete();
          });
        }
        
        return this.errorService.handleError(error, 'Fetching comments for ticket');
      })
    );
  }

  getCommentById(commentId: number | string): Observable<CommentResponse> {
    // Normalize the ID
    const normalizedId = normalizeId(commentId);
    
    if (normalizedId === null) {
      console.error('Invalid comment ID provided to getCommentById');
      return this.errorService.handleGenericError(new Error('Valid comment ID is required'), 'Fetching comment details');
    }
    
    return this.http.get<CommentResponse>(`${this.apiUrl}/${normalizedId}`).pipe(
      tap(comment => console.log('Fetched comment:', comment)),
      catchError(error => this.errorService.handleError(error, 'Fetching comment details'))
    );
  }

  /**
   * Create a new comment
   * @param commentRequest The comment data
   * @returns Observable of CommentResponse
   */
  createComment(commentRequest: CommentRequest): Observable<CommentResponse> {
    // Validate input
    if (!commentRequest.content || commentRequest.content.trim() === '') {
      console.error('Empty comment content in createComment');
      return throwError(() => new Error('Comment content is required'));
    }
    
    // Clone and ensure we're sending proper number for ticketId
    const normalizedId = normalizeId(commentRequest.ticketId);
    
    if (normalizedId === null) {
      console.error('Invalid ticket ID provided to createComment:', commentRequest.ticketId);
      return throwError(() => new Error('Valid ticket ID is required'));
    }
    
    const requestData = { 
      ...commentRequest,
      ticketId: normalizedId
    };
    
    console.log(`Creating comment for ticket ${normalizedId} at: ${this.apiUrl}`, requestData);
    
    return this.http.post<CommentResponse>(this.apiUrl, requestData).pipe(
      tap(response => console.log('Created comment:', response)),
      catchError(error => {
        console.error(`Error creating comment for ticket ${normalizedId}:`, error);
        return this.errorService.handleError(error, 'Creating comment');
      })
    );
  }


  updateComment(commentId: number | string, commentRequest: CommentRequest): Observable<CommentResponse> {
    // Normalize the ID
    const normalizedId = normalizeId(commentId);
    
    if (normalizedId === null) {
      console.error('Invalid comment ID provided to updateComment');
      return this.errorService.handleGenericError(new Error('Valid comment ID is required'), 'Updating comment');
    }
    
    return this.http.put<CommentResponse>(`${this.apiUrl}/${normalizedId}`, commentRequest).pipe(
      tap(response => console.log('Updated comment:', response)),
      catchError(error => this.errorService.handleError(error, 'Updating comment'))
    );
  }


  deleteComment(commentId: number | string): Observable<void> {
    // Normalize the ID
    const normalizedId = normalizeId(commentId);
    
    if (normalizedId === null) {
      console.error('Invalid comment ID provided to deleteComment');
      return this.errorService.handleGenericError(new Error('Valid comment ID is required'), 'Deleting comment');
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${normalizedId}`).pipe(
      tap(() => console.log(`Deleted comment with ID ${normalizedId}`)),
      catchError(error => this.errorService.handleError(error, 'Deleting comment'))
    );
  }

  getMyComments(): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.apiUrl}/my-comments`).pipe(
      tap(comments => console.log(`Fetched ${comments.length} comments created by authenticated user`)),
      catchError(error => this.errorService.handleError(error, 'Fetching user comments'))
    );
  }
}
