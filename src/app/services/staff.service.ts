import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, catchError, tap } from "rxjs/operators";
import { StaffRequest } from "../models/staff.model";
import { Observable, throwError, Subject, BehaviorSubject } from "rxjs";
import { User } from "../models/user.model";

@Injectable({
    providedIn: 'root'
})
export class StaffService {
    private baseUrl = 'http://localhost:8222/api/v1/employees';
    private staffListSubject = new BehaviorSubject<User[]>([]);
    private staffList$ = this.staffListSubject.asObservable();

    constructor(private http: HttpClient) { }

    // Get the observable
    getStaffList(): Observable<User[]> {
        return this.staffList$;
    }

    // Refresh the staff list
    refreshStaffList(): void {
        this.getStaffByPartnerTenant().subscribe(staff => {
            this.staffListSubject.next(staff);
        });
    }

    CreateStaff(data: StaffRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/create-staff`, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            observe: 'response'
        }).pipe(
            map(response => {
                if (response.status === 200 || response.status === 201) {
                    // Refresh the staff list after successful creation
                    this.refreshStaffList();
                    return response.body;
                }
                throw new Error('Unexpected response status: ' + response.status);
            }),
            catchError((error: HttpErrorResponse) => {
                if (error.status === 200 || error.status === 201) {
                    this.refreshStaffList();
                    return error.error;
                }
                return throwError(() => error);
            })
        );
    }

    getStaffByPartnerTenant(): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/my-staff`).pipe(
            tap(staff => {
                this.staffListSubject.next(staff);
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('Error fetching staff:', error);
                return throwError(() => error);
            })
        );
    }

    getStaffById(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    // Filter staff by role (frontend filtering)
    filterStaffByRole(staff: User[], role: string | null): User[] {
        if (!role || role === 'ALL') {
            return staff;
        }
        return staff.filter(member => member.role === role);
    }

    // Search staff by name or email (frontend search)
    searchStaff(staff: User[], searchTerm: string): User[] {
        if (!searchTerm) {
            return staff;
        }
        const lowercaseSearch = searchTerm.toLowerCase();
        return staff.filter(member => 
            member.firstname?.toLowerCase().includes(lowercaseSearch) ||
            member.lastname?.toLowerCase().includes(lowercaseSearch) ||
            member.email.toLowerCase().includes(lowercaseSearch)
        );
    }
}