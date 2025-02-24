import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';

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
}
export interface ChangePassword{
  currentPassword: string;
  newPassword:string; 
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
      role: response.role
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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

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

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/authenticate`, data, this.httpOptions)
      .pipe(
        tap(response => this.setUserData(response)),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }
  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot_password?email=${data.email}`, this.httpOptions)
      .pipe(
        map(response => {
          return response;
        })
      );
  }
  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/reset_password?token=${data.code}&password=${data.password}`,
   
      this.httpOptions
    ).pipe(
      map(response => {
        return response;
      })
    );
  }
  changePassword(data: ChangePassword): Observable<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);

    return this.http.post(`${this.baseUrl}/change-password`, data, { headers })
      .pipe(
        map(response => {
         return response;
        }),
      );
  }
  
  activateAccount(code: string): Observable<any> {
    // For GET requests, we don't need to set Content-Type header
    return this.http.get(`${this.baseUrl}/activate-account?token=${code}`)
      .pipe(
        map(response => {
          console.log('Raw activation response:', response);
          // Always return a consistent response format
          return {
            success: true,
            message: 'Account activated successfully'
          };
        }),
        catchError(error => {
          console.error('Account activation error:', error);
          // If it's a 200 status but treated as error, handle it as success
          if (error.status === 200) {
            return [{
              success: true,
              message: 'Account activated successfully'
            }];
          }
          throw error;
        })
      );
  }
} 
