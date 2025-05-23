import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface LogStatsDTO {
    day: string;      // Using day instead of date to match API response
    type: string;     // Type field from API response
    count: number;
  }
  
  export interface ActivityStatsDTO {
    day: string;      // Using day instead of date to match API response
    type: string;
    count: number;
  }

 export interface StatsResponse {
    totalPartners: number;
    activePartners: number;
    lockedPartners: number;
  }

  export interface UserStatsResponse {
    userId?: number;
    developerId?: number;
    tenant: string;
    assignedTicketsCount?: number;
    createdSolutionsCount?: number;
    projectsCount?: number;
  }

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = 'http://localhost:8222/api/v1/statistics';  // Using direct URL
  private baseUrl='http://localhost:8222/api/v1/auth/stats';
  constructor(private http: HttpClient) {
  }
  getErrorsByDayForProject(projectId: number, startDate?: string, endDate?: string): Observable<LogStatsDTO[]> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate);
    }
    
    if (endDate) {
      params = params.append('endDate', endDate);
    }
    
    return this.http.get<LogStatsDTO[]>(`${this.apiUrl}/errors-by-day/project/${projectId}`, { params })
      .pipe(
        tap(data => console.log(`Raw error stats data for project ${projectId}:`, data))
      );
  }

  getActivitiesByDayForProject(projectId: number, startDate?: string, endDate?: string): Observable<ActivityStatsDTO[]> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.append('startDate', startDate);
    }
    
    if (endDate) {
      params = params.append('endDate', endDate);
    }
    
    return this.http.get<ActivityStatsDTO[]>(`${this.apiUrl}/activity-by-day/project/${projectId}`, { params })
      .pipe(
        tap(data => console.log(`Raw activity stats data for project ${projectId}:`, data))
      );
  }

  getTotalErrorsForProject(projectId: number): Observable<number> {
    return this.http.get<{projectId: number, totalErrors: number}>(`${this.apiUrl}/total-errors/project/${projectId}`)
      .pipe(
        map(response => response.totalErrors),
        tap(count => console.log(`Total errors for project ${projectId}:`, count))
      );
  }
      
  getPartnerStats(): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.baseUrl}/partners`);
  }
  getBlockedAgenciesCount(): Observable<number> {
    return this.getPartnerStats().pipe(
      map(stats => stats.lockedPartners)
    );
  }
  getActiveAgenciesCount(): Observable<number> {
    return this.getPartnerStats().pipe(
      map(stats => stats.activePartners)
    );
  }
  getAllAgenciesCount(): Observable<number> {
    return this.getPartnerStats().pipe(
      map(stats => stats.totalPartners)
    );
  }

  //staf service 
  getTicketCountByUser(userId: number, tenant: string): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/tickets-count/user/${userId}/tenant/${tenant}`)
      .pipe(
        tap(data => console.log(`Ticket count for user ${userId} in tenant ${tenant}:`, data))
      );
  }

  getSolutionCountByDeveloper(developerId: number, tenant: string): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/solutions-count/developer/${developerId}/tenant/${tenant}`)
      .pipe(
        tap(data => console.log(`Solution count for developer ${developerId} in tenant ${tenant}:`, data))
      );
  }


  getProjectCountByUser(userId: number): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.baseUrl}/projects-count/user/${userId}`)
      .pipe(
        tap(data => console.log(`Project count for user ${userId}:`, data))
      );
  }
}