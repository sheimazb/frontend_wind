import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import {
  PartnerAccountStatusRequest,
  PartnerAccountStatusResponse,
  PartnerResponse,
} from '../models/partner.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  
  private apiUrl = 'http://localhost:8222/api/v1/admin';

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);

    if (error.status === 403) {
      // Forbidden - User doesn't have admin privileges
      this.router.navigate(['/unauthorized']);
      return throwError(() => new Error('You do not have permission to access this resource. Please contact your administrator.'));
    }

    if (error.error instanceof Blob) {
      return from(error.error.text()).pipe(
        tap(text => console.error('Error response content:', text)),
        mergeMap(() => throwError(() => new Error('Operation failed. Please try again.')))
      );
    }

    // Handle other types of errors
    const message = error.error?.message || 'An unexpected error occurred. Please try again.';
    return throwError(() => new Error(message));
  }

  getAllPartners(): Observable<PartnerResponse[]> {
    return this.http.get<PartnerResponse[]>(`${this.apiUrl}/partners`)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }
  
  updatePartnerAccountStatus(email: string, request: PartnerAccountStatusRequest): Observable<PartnerAccountStatusResponse> {
    return this.http.post<PartnerAccountStatusResponse>(
      `${this.apiUrl}/edit-status/${email}`, 
      request
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }
}
