import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8222/api/v1/projects';

  constructor(private http: HttpClient) {}

  // Create a project
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
      map(response => new Project(response))
    );
  }

  // Get project by ID
  getProjectById(id: number): Observable<Project> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => new Project(response))
    );
  }

  // Get all projects by tenant 
  getAllProjects(): Observable<Project[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  // Update project
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
      map(response => new Project(response))
    );
  }

  // Delete project
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Search projects by tag
  searchProjectsByTag(tag: string): Observable<Project[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?tag=${tag}`).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }

  // Get project members
  getProjectMembers(projectId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${projectId}/users`);
  }

  // Add user to project
  addUserToProject(projectId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/users/${userId}`, {});
  }

  // Remove user from project
  removeUserFromProject(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/users/${userId}`);
  }

  // Get user projects
  getUserProjects(userId: number): Observable<Project[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`).pipe(
      map(projects => projects.map(p => new Project(p)))
    );
  }
}
