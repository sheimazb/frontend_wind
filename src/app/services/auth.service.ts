import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';

// Interface for the registration data
export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8222/api/v1/auth';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data, this.httpOptions)
      .pipe(
        map(response => {
          // If we get here, it means the request was successful
          // Even if response is empty or null
          return response || { success: true };
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }
} 
