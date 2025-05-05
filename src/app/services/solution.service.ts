import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
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

export interface DevelopersSolutions {
  id?: number;
  source?: string;
  author?: number;
  title?: string;
  content?: string;
  code?: string;
  votes?: number;
  commentCount?: number;
  url?: string;
  postedDate?: Date;
  sourceIcon?: string;
  // Additional fields from API response
  similarity?: string;
  errorType?: string;
  detectedTypes?: string[];
  exceptionTypes?: string[];
}

export interface LogAnalysisRequest {
  logMessage: string;
  k?: number;
}

export interface SimilarLog {
  logId?: number;
  logMessage?: string;
  ticketId?: number;
  errorType?: string;
  detectedTypes?: string[];
  exceptionTypes?: string[];
  solutionTitle?: string;
  solutionContent?: string;
  severity?: string;
  similarity?: string;
  termMatch?: string;
  matchDetails?: string;
  authorUserId?: number;
}
export interface QueryAnalysis {
  detectedTypes?: string[];
  severity?: string;
  errorCode?: string;
  exceptionTypes?: string[];
  termCount?: number;
  normalizedQuery?: string;
}
export interface LogRecommendationResponse {
  message?: string;
  similar_logs?: SimilarLog[];  // Notez le snake_case qui correspond probablement à votre JSON
  query_analysis?: QueryAnalysis;
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

  getSolutionById(id: number): Observable<Solution> {
    return this.http.get<Solution>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => this.errorService.handleError(error, 'Getting solution'))
      );
  }

  getSolutionByTicketId(ticketId: number): Observable<Solution> {
    return this.http.get<Solution>(`${this.apiUrl}/ticket/${ticketId}`)
      .pipe(
        catchError(error => this.errorService.handleError(error, 'Getting solution by ticket ID'))
      );
  }

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

  getMySolutions(): Observable<Solution[]> {
    return this.http.get<Solution[]>(`${this.apiUrl}/my-solutions`)
      .pipe(
        catchError(error => this.errorService.handleError(error, 'Getting user solutions'))
      );
  }

  getRecommendations(request: LogAnalysisRequest): Observable<LogRecommendationResponse> {
    // Validation des données d'entrée
    if (!request.logMessage || request.logMessage.trim() === '') {
      console.error('Empty log message provided');
      return throwError(() => new Error('Log message cannot be empty'));
    }
  
    console.log('Getting recommendations for log message:', 
      request.logMessage.substring(0, Math.min(100, request.logMessage.length)) + '...');
    
    return this.http.post<LogRecommendationResponse>(
      `${this.apiUrl}/recommendations`, 
      request,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      tap(response => {
        const logCount = response.similar_logs?.length || 0;
        console.log(`Receiveddfd sfqf ${logCount} recommendations`);
      }),
      catchError(error => {
        console.error('Error getting recommendations:', error);
        this.errorService.handleError(error, 'Getting recommendations');
        return throwError(() => error);
      })
    );
  }

  saveOrUpdateSolution(solution: Solution): Observable<Solution> {
    // If the solution has an ID, update it
    if (solution.id) {
      return this.updateSolution(solution.id, solution);
    }
    // Otherwise, create a new one
    return this.createSolution(solution);
  }

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