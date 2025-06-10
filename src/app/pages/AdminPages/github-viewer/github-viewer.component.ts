import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GithubExplorerService } from '../../../services/github_explorer.service';

interface Repository {
  id: number;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  updated: string;
  private: boolean;
  owner: string;
}

interface FileTreeItem {
  name: string;
  type: 'tree' | 'blob';
  path: string;
  size?: number;
  lastCommit: {
    message: string;
    date: string;
    author: string;
  };
  children?: FileTreeItem[];
}

interface GitHubTreeResponse {
  repository: {
    name: string;
    branch: string;
    commit: {
      sha: string;
      message: string;
      author: string;
      date: string;
      commitsCount: number;
    };
  };
  tree: FileTreeItem[];
}

interface GitHubErrorResponse {
  error: string;
}

@Component({
  selector: 'app-github-interface',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './github-viewer.component.html',
  styleUrls: ['./github-viewer.component.css']
})
export class GitHubInterfaceComponent implements OnInit {
  @Input() projectId!: number;

  branches: string[] = ['main', 'develop', 'feature/ui'];
  currentBranch: string = 'main';
  fileTree: FileTreeItem[] = [];
  filteredFileTree: FileTreeItem[] = [];
  selectedFile: FileTreeItem | null = null;
  selectedFileContent: string = '';
  fileSearchTerm: string = '';
  expandedFolders: Set<string> = new Set();
  loading: boolean = false;
  errorMessage: string = '';
  
  // GitHub token settings
  showTokenInput: boolean = false;
  githubToken: string = '';
  tokenSaved: boolean = false;

  constructor(private githubService: GithubExplorerService) {}

  ngOnInit() {
    if (this.projectId) {
      this.loadBranches();
      // Check for saved token in localStorage
      const savedToken = localStorage.getItem('github_token');
      if (savedToken) {
        this.githubToken = savedToken;
        this.tokenSaved = true;
        this.githubService.setGithubToken(savedToken);
      }
    } else {
      console.error('ProjectId is not provided or is falsy:', this.projectId);
    }
  }

  loadBranches() {
    this.loading = true;
    this.errorMessage = '';
    this.githubService.getBranches(this.projectId).subscribe({
      next: (res: string) => {
        try {
          this.branches = JSON.parse(res);
          this.currentBranch = this.branches[0] || 'main';
          this.loadRepoTree();
        } catch (error) {
          console.error('Error parsing branches response:', error, 'Raw response:', res);
          this.errorMessage = 'Failed to parse branches data';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading branches:', err);
        this.loading = false;
        this.errorMessage = 'Failed to load branches';
      }
    });
  }

  loadRepoTree(path: string = '') {
    this.loading = true;
    this.errorMessage = '';
    this.githubService.getRepoTree(this.projectId, this.currentBranch, path).subscribe({
      next: (res: string) => {
        try {
          // Check if the response contains an error message (like rate limit)
          if (res.includes('"error"')) {
            const errorResponse = JSON.parse(res) as GitHubErrorResponse;
            console.error('GitHub API error:', errorResponse.error);
            this.errorMessage = this.extractErrorMessage(errorResponse.error);
            this.fileTree = [];
          } else {
            const data = JSON.parse(res) as GitHubTreeResponse;
            this.fileTree = data.tree || [];
          }
          this.filterFiles();
        } catch (error) {
          console.error('Error parsing repo tree response:', error, 'Raw response:', res);
          this.errorMessage = 'Failed to parse repository data';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading repo tree:', err);
        this.loading = false;
        this.errorMessage = 'Failed to load repository contents';
      }
    });
  }

  extractErrorMessage(errorString: string): string {
    // Check for GitHub rate limit error
    if (errorString.includes('rate limit exceeded')) {
      return 'GitHub API rate limit exceeded. Please try again later or use authenticated requests.';
    }
    return 'Failed to load repository data: ' + errorString.substring(0, 100);
  }

  onBranchChange() {
    this.loadRepoTree();
  }

  onItemClick(item: FileTreeItem) {
    if (item.type === 'tree') {
      this.toggleFolder(item.path);
    } else {
      this.selectedFile = item;
      this.loadFileContent(item.path);
    }
  }

  loadFileContent(path: string) {
    console.log('Loading content for path:', path); // Debug log
    this.errorMessage = '';
    this.githubService.getFileContent(this.projectId, path).subscribe({
      next: (res: string) => {
        console.log('Received content for path:', path, 'Length:', res.length); // Debug log
        if (res.includes('"error"')) {
          try {
            const errorResponse = JSON.parse(res) as GitHubErrorResponse;
            this.errorMessage = this.extractErrorMessage(errorResponse.error);
            this.selectedFileContent = '';
          } catch (error) {
            this.selectedFileContent = res;
          }
        } else if (res && res.trim()) {
          this.selectedFileContent = res;
        } else {
          console.warn('Empty or invalid content received for path:', path);
          this.selectedFileContent = 'No content available or file is empty.';
        }
      },
      error: (err) => {
        console.error('Error loading file content for path:', path, err);
        this.selectedFileContent = 'Error loading content. Check console for details.';
        this.errorMessage = 'Failed to load file content';
      }
    });
  }

  toggleFolder(path: string) {
    if (this.expandedFolders.has(path)) {
      this.expandedFolders.delete(path);
    } else {
      this.expandedFolders.add(path);
    }
  }

  toggleTokenInput() {
    this.showTokenInput = !this.showTokenInput;
  }

  saveToken() {
    if (this.githubToken && this.githubToken.trim()) {
      // Save token to localStorage
      localStorage.setItem('github_token', this.githubToken);
      this.tokenSaved = true;
      this.githubService.setGithubToken(this.githubToken);
      this.showTokenInput = false;
      // Reload data with the new token
      this.loadRepoTree();
    }
  }

  clearToken() {
    localStorage.removeItem('github_token');
    this.githubToken = '';
    this.tokenSaved = false;
    this.githubService.clearGithubToken();
  }

  isExpanded(path: string): boolean {
    return this.expandedFolders.has(path);
  }

  getFileLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'java': 'Java',
      'ts': 'TypeScript',
      'js': 'JavaScript',
      'html': 'HTML',
      'css': 'CSS',
      'py': 'Python',
      'md': 'Markdown',
      'json': 'JSON'
    };
    return langMap[ext || ''] || 'Text';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  filterFiles() {
    this.filteredFileTree = this.fileTree.filter(item =>
      item.name.toLowerCase().includes(this.fileSearchTerm.toLowerCase())
    );
  }
}