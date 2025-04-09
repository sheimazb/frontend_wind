import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8222/api/v1/projects';

  constructor(private http: HttpClient) {
  }

 /**
   * Creates a new project
   * @param project The project data to create
   * @returns Observable of the created project
   */
  createProject(project: Project): Observable<Project> {
    // Transform the data to match backend expectations
    const backendProject = {
      name: project.name,
      description: project.description,
      technologies: Array.isArray(project.technologies) ? project.technologies.join(',') : project.technologies,
      repositoryLink: project.repositoryLink,
      deadlineDate: project.deadlineDate,
      tags: project.tags || [],
      progressPercentage: project.progress || project.progressPercentage || 0,
      status: project.status,
      priority: project.priority,
      manager: project.manager
    };

    return this.http.post<any>(`${this.apiUrl}/create`, backendProject, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      map(response => new Project(response)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating project:', error);
        return of(new Project());
      })
    );
  }

  /**
   * Get project by ID
   * @param id The ID of the project to get
   * @returns Observable of the project
   */
  getProjectById(id: number): Observable<Project> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => new Project(response))
    );
  }

    /**
   * Get all projects by tenant 
   * @returns Observable of the projects
   */
  getAllProjects(): Observable<Project[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  /**
   * Update project
   * @param id The ID of the project to update
   * @param project The project data to update
   * @returns Observable of the updated project
   */
  updateProject(id: number, project: Project): Observable<Project> {
    const backendProject = {
      name: project.name,
      description: project.description,
      technologies: Array.isArray(project.technologies) ? project.technologies.join(',') : project.technologies,
      repositoryLink: project.repositoryLink,
      deadlineDate: project.deadlineDate,
      tags: project.tags || [],
      progressPercentage: project.progress || project.progressPercentage || 0,
      status: project.status,
      priority: project.priority,
      manager: project.manager
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, backendProject).pipe(
      map(response => new Project(response)),
      catchError((error: HttpErrorResponse) => {
        console.error(`Error updating project with ID ${id}:`, error);
        return of(new Project(project));
      })
    );
  }

  /**
   * Delete project
   * @param id The ID of the project to delete
   * @returns Observable of the deleted project
   */
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error deleting project with ID ${id}:`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Search projects by tag
   * @param tag The tag to search for
   * @returns Observable of the projects
   */
  searchProjectsByTag(tag: string): Observable<Project[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?tag=${tag}`).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  /**
   * Get project members
   * @param projectId The ID of the project to get members for
   * @returns Observable of the project members
   */
  getProjectMembers(projectId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${projectId}/users`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error getting members for project ${projectId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Add user to project
   * @param projectId The ID of the project to add the user to
   * @param userId The ID of the user to add to the project
   * @returns Observable of the added user
   */
  addUserToProject(projectId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/users/${userId}`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error adding user ${userId} to project ${projectId}:`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Remove user from project
   * @param projectId The ID of the project to remove the user from
   * @param userId The ID of the user to remove from the project
   * @returns Observable of the removed user
   */
  removeUserFromProject(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/users/${userId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(`Error removing user ${userId} from project ${projectId}:`, error);
        return of(undefined);
      })
    );
  }

  /**
   * Get user projects
   * @param userId The ID of the user to get projects for
   * @returns Observable of the user's projects
   */
  getUserProjects(userId: number): Observable<Project[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }
}
