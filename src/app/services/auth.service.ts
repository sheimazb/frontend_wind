import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError, of } from 'rxjs';

// Interface for the registration data
export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  id: number;
  tenant: string;
}

export interface ChangePasswordRequest {
  email: string;
  currentPassword: string;
  newPassword: string;
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

  private setUserData(response: LoginResponse) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify({
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      id: response.id,
      tenant: response.tenant
    }));
  }

  private handleError(error: any) {
    console.error('Auth Service Error:', error);
    
    // If the error is already formatted by our interceptor
    if (error.status && error.message) {
      return throwError(() => error);
    }

    // If it's an HTTP error
    if (error instanceof HttpErrorResponse) {
      // Check if it's actually a successful text response
      if (error.status === 200 && error.error instanceof ProgressEvent) {
        return throwError(() => ({
          status: 200,
          message: 'Operation completed successfully',
          success: true
        }));
      }

      const message = error.error?.message || 'An unexpected error occurred';
      return throwError(() => ({
        status: error.status,
        message: message
      }));
    }

    // For any other type of error
    return throwError(() => ({
      status: 500,
      message: 'An unexpected error occurred'
    }));
  }

  getCurrentUser(): { email: string; fullName: string; role: string } | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

 /* logout(): Observable<any> { 
    return this.http.post(`${this.baseUrl}/logout`, {}, this.httpOptions).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }),
      catchError(error => this.handleError(error))
    );
  }*/

    logout(){
      localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data, this.httpOptions)
      .pipe(
        map(response => {
          return response || { success: true, message: 'Registration successful' };
        }),
        catchError(error => this.handleError(error))
      );
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/authenticate`, data, this.httpOptions)
      .pipe(
        tap(response => this.setUserData(response)),
        catchError(error => this.handleError(error))
      );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot_password?email=${data.email}`, {}, {
      ...this.httpOptions,
      responseType: 'text'
    }).pipe(
      map(response => ({ success: true, message: response || 'Password reset email sent' })),
      catchError(error => this.handleError(error))
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/reset_password?token=${data.code}&password=${data.password}`,
      {},
      { ...this.httpOptions, responseType: 'text' }
    ).pipe(
      map(response => ({ success: true, message: response || 'Password reset successful' })),
      catchError(error => this.handleError(error))
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/change-password`,
      request,
      { ...this.httpOptions, responseType: 'text' }
    ).pipe(
      map(response => ({ success: true, message: response || 'Password changed successfully' })),
      catchError(error => this.handleError(error))
    );
  }
  
  activateAccount(code: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/activate-account?token=${code}`,
      { responseType: 'text' }
    ).pipe(
      map(response => ({
        success: true,
        message: response || 'Account activated successfully'
      })),
      catchError(error => {
        if (error.status === 200) {
          return [{ success: true, message: 'Account activated successfully' }];
        }
        return this.handleError(error);
      })
    );
  }

  requestPasswordChange(data: ChangePasswordRequest): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/request-password-change`,
      data,
      { ...this.httpOptions, responseType: 'text' }
    ).pipe(
      map(response => ({
        success: true,
        message: response || 'Password change requested successfully'
      })),
      catchError(error => this.handleError(error))
    );
  }

  verifyAndChangePassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/verify-and-change-password`,
      { token, newPassword },
      { ...this.httpOptions, responseType: 'text' }
    ).pipe(
      map(response => ({
        success: true,
        message: response || 'Password changed successfully'
      })),
      catchError(error => {
        // If it's a successful text response but treated as error
        if (error.status === 200 && error.error instanceof ProgressEvent) {
          return of({
            success: true,
            message: 'Password changed successfully'
          });
        }
        console.error('Error in verifyAndChangePassword:', error);
        return this.handleError(error);
      })
    );
  }
} 
