import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PartnerResponse } from '../models/partner.model';

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
            'Authorization': `Bearer ${token}`
          })
        };
        return this.http.get<PartnerResponse[]>(`${this.apiUrl}/partners`, httpOptions);
  
    }
}