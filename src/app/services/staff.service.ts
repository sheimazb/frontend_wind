import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, catchError } from "rxjs/operators";
import { StaffRequest } from "../models/staff.model";
import { Observable, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private baseUrl = 'http://localhost:8222/api/v1/employees';

    constructor(private http: HttpClient) { }

    CreateStaff(data: StaffRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/create-staff`, data,
            {
            headers: {
              'Content-Type': 'application/json'
            }
          });
    }
}