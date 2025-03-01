import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import {
  PartnerAccountStatusRequest,
  PartnerAccountStatusResponse,
  PartnerResponse,
} from '../models/partner.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8222/api/v1/admin';

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAllPartners(): Observable<PartnerResponse[]> {
    const token = this.getToken();
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
    return this.http.get<PartnerResponse[]>(
      `${this.apiUrl}/partners`,
      httpOptions
    );
  }
  
  updatePartnerAccountStatus(email: string, request: PartnerAccountStatusRequest): Observable<PartnerAccountStatusResponse> {
    const token = this.getToken();
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  
    return this.http.post<PartnerAccountStatusResponse>(
      `${this.apiUrl}/edit-status/${email}`, 
      request,  // Send the request object directly as JSON
      httpOptions
    ).pipe(
      catchError(error => {
        console.error('Profile update error details:', error);
  
        if (error.error instanceof Blob) {
          return from(error.error.text()).pipe(
            tap(text => console.error('Error response content:', text)), 
            mergeMap(() => throwError(() => error))
          );
        }
  
        return throwError(() => error);
      })
    );
  }
  
  
}
