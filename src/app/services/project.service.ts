import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8222/api/v1/projects';

  constructor(private http: HttpClient) {
  }

 
  createProject(projectData: FormData | Project): Observable<Project> {
    if (projectData instanceof FormData) {
      // If FormData is provided, send it directly
      console.log('Sending FormData directly to API');
      
      // Log FormData entries for debugging (in development only)
      if (console.debug) {
        console.debug('FormData entries:');
        // Use type assertion to any to access entries method
        const formDataAny = projectData as any;
        if (formDataAny.entries) {
          for (const pair of formDataAny.entries()) {
            console.debug(`${pair[0]}: ${pair[1]}`);
          }
        }
      }
      
      return this.http.post<any>(`${this.apiUrl}`, projectData).pipe(
        map(response => new Project(response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error creating project:', error);
          throw error;
        })
      );
    } else {
      // Convert Project object to FormData
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', projectData.name.trim());
      formData.append('description', projectData.description.trim());
      formData.append('repositoryLink', projectData.repositoryLink.trim());
      formData.append('primaryTag', projectData.projectTag.trim());
      formData.append('deadlineDate', projectData.deadlineDate);
      formData.append('progressPercentage', (projectData.progressPercentage || 0).toString());
      formData.append('status', projectData.status || 'Active');
      formData.append('priority', projectData.priority || 'Medium');
      
      // Add creator information if available
      if (projectData.creator && projectData.creator.id) {
        formData.append('creatorId', projectData.creator.id.toString());
      }
      
      // Handle technologies as an array
      if (projectData.technologies && projectData.technologies.length > 0) {
        // Option 1: As a comma-separated string
        formData.append('technologies', projectData.technologies.join(', '));
        
        // Option 2: As an array with indexed naming
        projectData.technologies.forEach((tech, index) => {
          formData.append(`technologiesArray[${index}]`, tech);
        });
      }
      
      // Handle tags
      if (projectData.tags && projectData.tags.length > 0) {
        projectData.tags.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag);
        });
      }
      
      // Handle allowed roles
      if (projectData.allowedRoles && projectData.allowedRoles.length > 0) {
        projectData.allowedRoles.forEach((role, index) => {
          formData.append(`allowedRoles[${index}]`, role.name);
        });
      }
      
      // Add logo if it exists
      if (projectData.logo instanceof File) {
        formData.append('logo', projectData.logo, projectData.logo.name);
      }

      // Log the data being sent
      console.log('Converted Project to FormData');

      return this.http.post<any>(`${this.apiUrl}`, formData).pipe(
        map(response => new Project(response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error creating project:', error);
          throw error;
        })
      );
    }
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => new Project(response))
    );
  }

  getAllProjects(): Observable<Project[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  updateProject(id: number, projectData: FormData | Project): Observable<Project> {
    if (projectData instanceof FormData) {
      // If FormData is provided, send it directly
      console.log('Sending FormData directly to API for update');
      
      // Log FormData entries for debugging (in development only)
      if (console.debug) {
        console.debug('FormData entries for update:');
        // Use type assertion to any to access entries method
        const formDataAny = projectData as any;
        if (formDataAny.entries) {
          for (const pair of formDataAny.entries()) {
            console.debug(`${pair[0]}: ${pair[1]}`);
          }
        }
      }
      
      return this.http.put<any>(`${this.apiUrl}/${id}`, projectData).pipe(
        map(response => new Project(response)),
        catchError((error: HttpErrorResponse) => {
          console.error(`Error updating project with ID ${id}:`, error);
          throw error;
        })
      );
    } else {
      // Convert Project object to FormData
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', projectData.name.trim());
      formData.append('description', projectData.description.trim());
      formData.append('repositoryLink', projectData.repositoryLink.trim());
      formData.append('primaryTag', projectData.projectTag.trim());
      formData.append('deadlineDate', projectData.deadlineDate);
      formData.append('progressPercentage', (projectData.progressPercentage || 0).toString());
      formData.append('status', projectData.status || 'Active');
      formData.append('priority', projectData.priority || 'Medium');
      
      // Handle technologies as an array
      if (projectData.technologies && projectData.technologies.length > 0) {
        // Option 1: As a comma-separated string
        formData.append('technologies', projectData.technologies.join(', '));
        
        // Option 2: As an array with indexed naming
        projectData.technologies.forEach((tech, index) => {
          formData.append(`technologiesArray[${index}]`, tech);
        });
      }
      
      // Handle tags
      if (projectData.tags && projectData.tags.length > 0) {
        projectData.tags.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag);
        });
      }
      
      // Handle allowed roles
      if (projectData.allowedRoles && projectData.allowedRoles.length > 0) {
        projectData.allowedRoles.forEach((role, index) => {
          formData.append(`allowedRoles[${index}]`, role.name);
        });
      }
      
      // Add logo if it exists
      if (projectData.logo instanceof File) {
        formData.append('logo', projectData.logo, projectData.logo.name);
      }

      console.log('Converted Project to FormData for update');

      return this.http.put<any>(`${this.apiUrl}/${id}`, formData).pipe(
        map(response => new Project(response)),
        catchError((error: HttpErrorResponse) => {
          console.error(`Error updating project with ID ${id}:`, error);
          throw error;
        })
      );
    }
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error deleting project with ID ${id}:`, error);
        return of(undefined);
      })
    );
  }

  searchProjectsByTag(tag: string): Observable<Project[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?tag=${tag}`).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  getProjectMembers(projectId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${projectId}/users`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting members for project ${projectId}:`, error);
        return of([]);
      })
    );
  }
  
  addUserToProject(projectId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/users/${userId}`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error adding user ${userId} to project ${projectId}:`, error);
        return of(undefined);
      })
    );
  }
 
  removeUserFromProject(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/users/${userId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error removing user ${userId} from project ${projectId}:`, error);
        return of(undefined);
      })
    );
  }
  
  getUserProjects(userId: number): Observable<Project[]> {
    // Check if the current user is a tester
    
    
    // For other roles, return only the projects they're assigned to
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  checkPrimaryTagExists(primaryTag: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check-primary-tag?tag=${primaryTag}`);
  }
}
