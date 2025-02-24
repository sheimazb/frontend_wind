import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, catchError } from "rxjs/operators";
import { StaffRequest } from "../models/staff.model";
import { Observable, throwError } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private baseUrl = 'http://localhost:8222/api/v1/employees';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHttpOptions() {
        const token = this.authService.getToken();
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            })
        };
    }

    CreateStaff(data: StaffRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/create-staff`, data, this.getHttpOptions())
            .pipe(
                map(response => {
                    if (response === null) {
                        return { success: true, message: 'Staff created successfully' };
                    }
                    return response;
                }),
                catchError((error: HttpErrorResponse) => {
                    let errorMessage = 'Create Staff failed. Please try again.';
                    if (error.error?.message) {
                        errorMessage = error.error.message;
                    } else if (error.status === 200 && error.statusText === 'OK') {
                        // If we get here with a 200 status, treat it as success
                        return [{ success: true, message: 'Staff created successfully' }];
                    }
                    return throwError(() => ({ message: errorMessage }));
                })
            );
    }
}