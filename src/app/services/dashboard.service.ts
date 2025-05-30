import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { DashboardData } from '../models/dashboard.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = "http://localhost:8222/api/v1/statistics/dashboard";
  private projectDetailsUrl = "http://localhost:8222/api/v1/statistics/logs/project";

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<DashboardData> {
    // Get the token from localStorage
    const token = localStorage.getItem('access_token'); // or whatever key you use to store the token

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Add the Bearer token
    });

    return this.http.get<DashboardData>(this.apiUrl, { 
      headers,
      withCredentials: true // Include cookies if you're using cookie-based auth
    }).pipe(
      catchError(this.handleError)
    );
  }

  getProjectDetails(projectId: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.projectDetailsUrl}/${projectId}/details`, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      // Handle specific error cases
      if (error.status === 401) {
        errorMessage = 'Unauthorized: Please log in again';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden: You do not have permission to access this resource';
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
} 