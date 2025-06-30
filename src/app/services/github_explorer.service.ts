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

  /**
   * Get repository tree structure for a project
   * @param projectId Project ID
   * @param path Optional path within the repository (defaults to root)
   */
  getRepoTree(projectId: number, path: string = ''): Observable<string> {
    let url = `${this.baseUrl}/api/v1/projects/${projectId}/github/tree`;
    if (path) {
      url += `?path=${encodeURIComponent(path)}`;
    }
    
    console.log('Making getRepoTree request to:', url);
    console.log('Parameters:', { projectId, path });

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

  /**
   * Get enhanced repository tree structure for a project (with better error handling)
   * @param projectId Project ID
   * @param path Optional path within the repository (defaults to root)
   */
  getEnhancedRepoTree(projectId: number, path: string = ''): Observable<string> {
    let url = `${this.baseUrl}/api/v1/projects/${projectId}/github/tree-enhanced`;
    if (path) {
      url += `?path=${encodeURIComponent(path)}`;
    }
    
    console.log('Making getEnhancedRepoTree request to:', url);
    console.log('Parameters:', { projectId, path });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getEnhancedRepoTree response received:', response);
      }),
      catchError(error => {
        console.error('getEnhancedRepoTree error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get file content from GitHub repository
   * @param projectId Project ID
   * @param path Path to the file in the repository
   */
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

  /**
   * Get all branches from GitHub repository
   * @param projectId Project ID
   */
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

  /**
   * Get commits from GitHub repository
   * @param projectId Project ID
   */
  getCommits(projectId: number): Observable<string> {
    const url = `${this.baseUrl}/api/v1/projects/${projectId}/github/commits`;
    
    console.log('Making getCommits request to:', url);
    console.log('Parameters:', { projectId });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getCommits response received:', response);
      }),
      catchError(error => {
        console.error('getCommits error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }

  /**
   * List files and folders in GitHub repository
   * @param projectId Project ID
   * @param path Optional path within the repository
   */
  listFilesAndFolders(projectId: number, path?: string): Observable<string> {
    let url = `${this.baseUrl}/api/v1/projects/${projectId}/github/list`;
    if (path) {
      url += `?path=${encodeURIComponent(path)}`;
    }
    
    console.log('Making listFilesAndFolders request to:', url);
    console.log('Parameters:', { projectId, path });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('listFilesAndFolders response received:', response);
      }),
      catchError(error => {
        console.error('listFilesAndFolders error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get repository information
   * @param projectId Project ID
   */
  getRepositoryInfo(projectId: number): Observable<string> {
    const url = `${this.baseUrl}/api/v1/projects/${projectId}/github/info`;
    
    console.log('Making getRepositoryInfo request to:', url);
    console.log('Parameters:', { projectId });

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getRepositoryInfo response received:', response);
      }),
      catchError(error => {
        console.error('getRepositoryInfo error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get GitHub API rate limit status
   */
  getRateLimitStatus(): Observable<string> {
    const url = `${this.baseUrl}/api/v1/projects/github/rate-limit`;
    
    console.log('Making getRateLimitStatus request to:', url);

    return this.http.get(url, { 
      responseType: 'text',
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('getRateLimitStatus response received:', response);
      }),
      catchError(error => {
        console.error('getRateLimitStatus error:', error);
        console.error('Request URL was:', url);
        return throwError(() => error);
      })
    );
  }
}