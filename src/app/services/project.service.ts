import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
export interface Project {
  id?: number;
  name: string;  // maps to 'nom' in backend
  description: string;
  technologies: string | string[];  // handle both string and array
  repositoryLink: string;
  deadlineDate: string;  // maps to 'deadlineAlert' in backend
  tags?: string[];  // Add tags property as optional
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:8222/api/v1/projects';

  constructor(private http: HttpClient) {}

  // Create a project
  createProject(project: Project): Observable<Project> {
    // Log incoming project data
    console.log('Received project data:', {
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      repositoryLink: project.repositoryLink,
      deadlineDate: project.deadlineDate
    });

    // Transform the data to match backend expectations
    const backendProject = {
      name: project.name,  // 'name' maps to 'nom' in backend
      description: project.description,
      technologies: Array.isArray(project.technologies) ? project.technologies.join(',') : project.technologies,
      repositoryLink: project.repositoryLink,
      deadlineDate: project.deadlineDate,  // 'deadlineDate' maps to 'deadlineAlert' in backend
      tags: project.tags || []
    };

    // Log the transformed data
    console.log('Transformed data for backend:', backendProject);
    
    // Make the API call with Content-Type header
    return this.http.post<Project>(
      `${this.apiUrl}/create`, 
      backendProject,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Get project by ID
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  // Get all projects by tenant 
  getAllProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  // Update project
  updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  // Delete project
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Search projects by tag
  searchProjectsByTag(tag: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/search?tag=${tag}`);
  }

  // Add user to project
  addUserToProject(projectId: number, userId: number): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/${projectId}/users/${userId}`, {});
  }

  // Get project members
  getProjectMembers(projectId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${projectId}/users`);
  }
}
