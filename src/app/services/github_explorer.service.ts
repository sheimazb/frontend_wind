// github-explorer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GithubExplorerService {
  private baseUrl = 'http://localhost:8222';
  private githubToken: string | null = null;

  constructor(private http: HttpClient) {
    console.log('GithubExplorerService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Set a GitHub personal access token to increase rate limits
   * @param token GitHub personal access token
   */
  setGithubToken(token: string) {
    this.githubToken = token;
    console.log('GitHub token set');
  }

  /**
   * Clear the GitHub token
   */
  clearGithubToken() {
    this.githubToken = null;
    console.log('GitHub token cleared');
  }

  /**
   * Get HTTP headers with optional GitHub token
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (this.githubToken) {
      headers = headers.set('X-GitHub-Token', this.githubToken);
    }
    
    return headers;
  }

  getRepoTree(projectId: number, branch: string, path: string = ''): Observable<string> {
    let url = `${this.baseUrl}/api/v1/projects/${projectId}/github/tree?branch=${encodeURIComponent(branch)}`;
    if (path) url += `&path=${encodeURIComponent(path)}`;
    
    console.log('Making getRepoTree request to:', url);
    console.log('Parameters:', { projectId, branch, path });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getRepoTree response received:', response);
      }),
      catchError(error => {
        console.error('getRepoTree error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }

  getFileContent(projectId: number, path: string): Observable<string> {
    const url = `${this.baseUrl}/api/v1/projects/${projectId}/github/file?path=${encodeURIComponent(path)}`;
    
    console.log('Making getFileContent request to:', url);
    console.log('Parameters:', { projectId, path });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getFileContent response received for path:', path);
        console.log('Content length:', response.length);
      }),
      catchError(error => {
        console.error('getFileContent error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }

  getBranches(projectId: number): Observable<string> {
    const url = `${this.baseUrl}/api/v1/projects/${projectId}/github/branches`;
    
    console.log('Making getBranches request to:', url);
    console.log('Parameters:', { projectId });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getBranches response received:', response);
      }),
      catchError(error => {
        console.error('getBranches error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }
}