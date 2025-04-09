import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError, of, timer } from 'rxjs';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { Log, LogSeverity, LogType } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = 'http://localhost:8222/api/v1/logs';
  private mockLogs: Log[] = [];

  constructor(private http: HttpClient) {
  }

  // Get all logs by tenant 
  getAllLogs(tenant: string): Observable<Log[]> {
    if (!tenant) {
      console.error('No tenant provided to getAllLogs');
      return of([]);
    }
    
    return this.http.get<Log[]>(`${this.apiUrl}/logs-by-tenant/${tenant}`).pipe(
      map(logs => logs.map(l => ({...l}))),
      catchError((error: HttpErrorResponse) => {
        console.error('Error getting logs by tenant:', error);
        return throwError(() => new Error('Error getting logs by tenant'));
      })
      );
  }

  getLogById(id: string): Observable<Log> {
    if (!id) {
      console.error('No ID provided to getLogById');
      return throwError(() => new Error('Log ID is required'));
    }
    
    return this.http.get<Log>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting log with ID ${id}:`, error);
        return throwError(() => new Error(`Log with ID ${id} not found`));
      })
    );
  }

  getLogsByProjectId(projectId: string): Observable<Log[]> {
    if (!projectId) {
      console.error('No project ID provided to getLogsByProjectId');
      return of([]);
    }
    
    console.log(`Fetching logs for project ID: ${projectId}`);
    
    return this.http.get<Log[]>(`${this.apiUrl}/project/${projectId}`).pipe(
      map(logs => logs.map(l => ({...l}))),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting logs for project ${projectId}:`, error);
        
        // Return mock data in case of error
        const filteredMockLogs = this.mockLogs.filter(log => {
          return log.projectId?.toString() === projectId.toString();
        });
        
        console.log(`Returning ${filteredMockLogs.length} mock logs for project ${projectId}`);
        return of(filteredMockLogs);
      })
    );
  }

  /**
   * Get occurrence count statistics for a specific log ID
   * This would typically be an actual API call to get statistics
   * for how often this error/log has occurred in the system
   */
  getLogOccurrenceStats(logId: string | number): Observable<{ 
    count: number;
    percentage: number;
    firstSeen: Date;
    lastSeen: Date;
  }> {
    // This would be a real API call in a production environment
    // For now, we'll simulate it with mock data
    
    console.log(`Fetching occurrence stats for log ID: ${logId}`);
    
    // Simulate API latency
    return timer(800).pipe(
      map(() => {
        // Generate plausible mock data
        const count = Math.floor(Math.random() * 20000) + 100;
        const percentage = Math.floor(Math.random() * 70) + 20;
        
        // Generate first and last seen dates (last seen being more recent)
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
        const firstSeen = new Date(now);
        firstSeen.setDate(firstSeen.getDate() - daysAgo);
        
        const hoursAgo = Math.floor(Math.random() * 24); // 0-24 hours ago
        const lastSeen = new Date(now);
        lastSeen.setHours(lastSeen.getHours() - hoursAgo);
        
        return {
          count,
          percentage,
          firstSeen,
          lastSeen
        };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting occurrence stats for log ${logId}:`, error);
        
        // Return default values if the API fails
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return of({
          count: 100,
          percentage: 25,
          firstSeen: weekAgo,
          lastSeen: now
        });
      })
    );
  }
}