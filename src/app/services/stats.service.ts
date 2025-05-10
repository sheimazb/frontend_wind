import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = 'http://localhost:8222/api/v1/statistics';  // Using direct URL

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
  
}