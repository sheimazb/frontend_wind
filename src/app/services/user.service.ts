import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8222/api/v1/users';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  updateUser(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-user/${data.email}`, data, this.httpOptions)
      .pipe(
        map(response => {
          return response;
        })
      );
  }

}