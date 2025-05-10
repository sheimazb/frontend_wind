import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { AuthService } from './auth.service';

// Define the ProjectType enum to match backend
export enum ProjectType {
  MONOLITHIC = 'MONOLITHIC',
  MICROSERVICES = 'MICROSERVICES',
  MICROSERVICES_PACKAGE = 'MICROSERVICES_PACKAGE'
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8222/api/v1/projects';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helper method to get authorization headers
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found in localStorage');
    } else {
      console.log('Using token for request:', token.substring(0, 15) + '...');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
 
  createProject(projectData: FormData | Project): Observable<Project> {
    const headers = this.getHeaders();
    
    if (projectData instanceof FormData) {
      // If FormData is provided, send it directly
      console.log('Sending FormData directly to API with auth headers');
      
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
      
      return this.http.post<any>(
        `${this.apiUrl}`, 
        projectData,
        { headers }
      ).pipe(
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
      
      // Add project type
      formData.append('projectType', projectData.projectType || ProjectType.MONOLITHIC);
      
      // Add parent project ID if it's a microservice
      if (projectData.parentProject && projectData.parentProject.id) {
        formData.append('parentProject.id', projectData.parentProject.id.toString());
      }
      
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

      return this.http.post<any>(
        `${this.apiUrl}`, 
        formData,
        { headers }
      ).pipe(
        map(response => new Project(response)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error creating project:', error);
          throw error;
        })
      );
    }
  }

  getProjectById(id: number): Observable<Project> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map(response => new Project(response))
    );
  }

  getAllProjects(): Observable<Project[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(this.apiUrl, { headers }).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  getMicroservicesInPackage(packageId: number): Observable<Project[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/packages/${packageId}/microservices`, { headers }).pipe(
      map(projects => projects.map(p => new Project(p))),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting microservices for package ${packageId}:`, error);
        return of([]);
      })
    );
  }

  createMicroservice(microservice: FormData | Project, packageId: number): Observable<Project> {
    console.log(`Creating microservice with parent package ID: ${packageId}`);
    
    // Get authorization headers
    const headers = this.getHeaders();
    
    // Use the new dedicated endpoint for microservices
    return this.http.post<any>(
      `${this.apiUrl}/packages/${packageId}/microservices`, 
      microservice,
      { headers }
    ).pipe(
      map(response => new Project(response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating microservice:', error);
        throw error;
      })
    );
  }

  createMicroservicePackage(packageData: Project | FormData): Observable<Project> {
    if (packageData instanceof FormData) {
      packageData.append('projectType', ProjectType.MICROSERVICES_PACKAGE);
      return this.createProject(packageData);
    } else {
      packageData.projectType = ProjectType.MICROSERVICES_PACKAGE;
      return this.createProject(packageData);
    }
  }

  updateProject(id: number, projectData: FormData | Project): Observable<Project> {
    const headers = this.getHeaders();
    
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
      
      return this.http.put<any>(`${this.apiUrl}/${id}`, projectData, { headers }).pipe(
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
      
      // Add project type
      formData.append('projectType', projectData.projectType || ProjectType.MONOLITHIC);
      
      // Add parent project ID if it's a microservice
      if (projectData.parentProject && projectData.parentProject.id) {
        formData.append('parentProject.id', projectData.parentProject.id.toString());
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

      console.log('Converted Project to FormData for update');

      return this.http.put<any>(`${this.apiUrl}/${id}`, formData, { headers }).pipe(
        map(response => new Project(response)),
        catchError((error: HttpErrorResponse) => {
          console.error(`Error updating project with ID ${id}:`, error);
          throw error;
        })
      );
    }
  }

  deleteProject(id: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error deleting project with ID ${id}:`, error);
        return of(undefined);
      })
    );
  }

  searchProjectsByTag(tag: string): Observable<Project[]> {
    const headers = this.getHeaders();
    // This searches through the regular tags array
    return this.http.get<any[]>(`${this.apiUrl}/search?tag=${tag}`, { headers }).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  getProjectMembers(projectId: number): Observable<User[]> {
    const headers = this.getHeaders();
    return this.http.get<User[]>(`${this.apiUrl}/${projectId}/users`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting members for project ${projectId}:`, error);
        return of([]);
      })
    );
  }
  
  addUserToProject(projectId: number, userId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.post<void>(`${this.apiUrl}/${projectId}/users/${userId}`, {}, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error adding user ${userId} to project ${projectId}:`, error);
        return of(undefined);
      })
    );
  }
 
  removeUserFromProject(projectId: number, userId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/users/${userId}`, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error removing user ${userId} from project ${projectId}:`, error);
        return of(undefined);
      })
    );
  }
  
  getUserProjects(userId: number): Observable<Project[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`, { headers }).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  checkPrimaryTagExists(primaryTag: string): Observable<boolean> {
    // This checks if the unique primary tag identifier exists
    console.log('Checking primary tag (unique identifier):', primaryTag);
    const headers = this.getHeaders();
    return this.http.get<boolean>(`${this.apiUrl}/check-primary-tag?tag=${primaryTag}`, { headers })
      .pipe(
        map(response => {
          console.log('Primary tag check response (true means taken):', response);
          return response; // true means tag exists (is taken), false means tag is available
        }),
        catchError(error => {
          console.error('Error checking primary tag:', error);
          throw error;
        })
      );
  }

  getProjectsByType(type: ProjectType): Observable<Project[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/type/${type}`, { headers }).pipe(
      map(projects => projects.map(p => new Project(p))),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting projects of type ${type}:`, error);
        return of([]);
      })
    );
  }

  handleMicroserviceError(error: HttpErrorResponse, packageId: number | null): void {
    console.error(`Error creating microservice for package ${packageId}:`, error);
    
    // Check for validation errors from backend
    if (error.status === 400) {
      // Log potential validation issues
      console.error('Validation error details:', error.error);
      
      // Common validation errors
      if (error.error?.message?.includes('microservice')) {
        console.error('Microservice validation failed. Check required fields.');
      }
      
      if (error.error?.message?.includes('parent')) {
        console.error('Parent project validation failed. Verify package ID:', packageId);
      }
    }
    
    // Check for permission issues
    if (error.status === 403) {
      console.error('Permission denied. Possible reasons:');
      console.error('1. Your user role does not have microservice creation permissions');
      console.error('2. Token expired during the request');
      console.error('3. Package ID not owned by current user');
      
      // Log token information for debugging
      const token = localStorage.getItem('token');
      if (token) {
        const tokenSubstring = token.substring(0, 20) + '...';
        console.error('Current token (partial):', tokenSubstring);
      } else {
        console.error('No token found in localStorage');
      }
    }
    
    throw error;
  }
}