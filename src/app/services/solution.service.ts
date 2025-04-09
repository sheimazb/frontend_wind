import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorService } from './error.service';

export interface Solution {
  id?: number;
  title: string;
  complexity?: ComplexityLevel;
  content: string;
  authorUserId?: number;
  status?: SolutionStatus;
  estimatedTime?: number;
  costEstimation?: number;
  category?: string;
  tenant?: string;
  ticket?: { id: number };
  files?: Array<{name: string, url: string}>;
  createdAt?: string;
  updatedAt?: string;
}

export enum ComplexityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum SolutionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IMPLEMENTED = 'IMPLEMENTED'
}

@Injectable({
  providedIn: 'root'
})
export class SolutionService {
  private apiUrl = `${environment.apiUrl}/api/v1/solutions`;

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {}

  /**
   * Create a new solution
   * @param solution The solution data
   * @returns Observable of the created solution
   */
  createSolution(solution: Solution): Observable<Solution> {
    // Prepare request body with ticketId field
    const requestBody = this.prepareRequestBody(solution);
    
    // Make the API request
    return this.http.post<Solution>(this.apiUrl, requestBody)
      .pipe(
        tap(result => console.log('Solution created successfully:', result)),
        catchError(error => this.handleApiError(error, 'Creating solution'))
      );
  }

  /**
   * Get a solution by ID
   * @param id The solution ID
   * @returns Observable of the solution
   */
  getSolutionById(id: number): Observable<Solution> {
    return this.http.get<Solution>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => this.errorService.handleError(error, 'Getting solution'))
      );
  }

  /**
   * Get a solution by ticket ID
   * @param ticketId The ticket ID
   * @returns Observable of the solution
   */
  getSolutionByTicketId(ticketId: number): Observable<Solution> {
    return this.http.get<Solution>(`${this.apiUrl}/ticket/${ticketId}`)
      .pipe(
        catchError(error => this.errorService.handleError(error, 'Getting solution by ticket ID'))
      );
  }

  /**
   * Update a solution
   * @param id The solution ID
   * @param solution The updated solution data
   * @returns Observable of the updated solution
   */
  updateSolution(id: number, solution: Solution): Observable<Solution> {
    // Prepare request body with ticketId field
    const requestBody = this.prepareRequestBody(solution);
    
    // Make the API request
    return this.http.put<Solution>(`${this.apiUrl}/${id}`, requestBody)
      .pipe(
        tap(result => console.log('Solution updated successfully:', result)),
        catchError(error => this.handleApiError(error, 'Updating solution'))
      );
  }

  /**
   * Get solutions by the authenticated user
   * @returns Observable of the user's solutions
   */
  getMySolutions(): Observable<Solution[]> {
    return this.http.get<Solution[]>(`${this.apiUrl}/my-solutions`)
      .pipe(
        catchError(error => this.errorService.handleError(error, 'Getting user solutions'))
      );
  }

  /**
   * Create or update a solution based on whether it has an ID
   * @param solution The solution data
   * @returns Observable of the created or updated solution
   */
  saveOrUpdateSolution(solution: Solution): Observable<Solution> {
    // If the solution has an ID, update it
    if (solution.id) {
      return this.updateSolution(solution.id, solution);
    }
    // Otherwise, create a new one
    return this.createSolution(solution);
  }

  /**
   * Prepares request body for API calls by properly handling the ticket object
   */
  private prepareRequestBody(solution: Solution): any {
    const requestBody = { ...solution };
    
    // Convert ticket object to ticketId field
    if (requestBody.ticket && requestBody.ticket.id) {
      const ticketId = requestBody.ticket.id;
      delete requestBody.ticket;
      (requestBody as any).ticketId = ticketId;
    }
    
    return requestBody;
  }

  /**
   * Handles API errors with special handling for 409 Conflict errors
   */
  private handleApiError(error: HttpErrorResponse, operation: string): Observable<never> {
    // Special handling for 409 Conflict errors
    if (error.status === 409) {
      console.warn(`${operation}: A conflict occurred. This might be because this solution already exists or has been modified.`);
      
      // For 409 errors, provide a more descriptive operation message
      const customOperation = `${operation} - A solution for this ticket already exists`;
      return this.errorService.handleError(error, customOperation);
    }
    
    // For all other errors, use standard error handling
    return this.errorService.handleError(error, operation);
  }
} 