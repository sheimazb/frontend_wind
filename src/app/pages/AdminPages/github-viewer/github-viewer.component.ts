import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GithubExplorerService } from '../../../services/github_explorer.service';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';

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
  imports: [CommonModule, FormsModule, ClipboardModule],
  templateUrl: './github-viewer.component.html',
  styleUrls: ['./github-viewer.component.css']
})
export class GitHubInterfaceComponent implements OnInit, OnChanges {
  @Input() projectId!: number;

  branches: string[] = ['main'];
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

  // Initialization state
  private isInitialized: boolean = false;

  constructor(private githubService: GithubExplorerService, private clipboard: Clipboard ) {
   
  }

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reset component state when projectId changes
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      this.resetComponentState();
      this.initializeComponent();
    }
  }

  private initializeComponent() {
    if (!this.projectId) {
      console.error('ProjectId is not provided or is falsy:', this.projectId);
      this.errorMessage = 'Project ID is required';
      return;
    }

    // Check for saved token in localStorage
    this.loadSavedToken();
    
    // Load repository data
    this.loadRepositoryData();
    this.isInitialized = true;
  }

  private resetComponentState() {
    this.branches = ['main'];
    this.currentBranch = 'main';
    this.fileTree = [];
    this.filteredFileTree = [];
    this.selectedFile = null;
    this.selectedFileContent = '';
    this.fileSearchTerm = '';
    this.expandedFolders.clear();
    this.loading = false;
    this.errorMessage = '';
    this.isInitialized = false;
  }

  private loadSavedToken() {
    try {
      const savedToken = localStorage.getItem('github_token');
      if (savedToken) {
        this.githubToken = savedToken;
        this.tokenSaved = true;
        this.githubService.setGithubToken(savedToken);
      }
    } catch (error) {
      console.warn('Could not access localStorage for GitHub token:', error);
    }
  }

  private loadRepositoryData() {
    // First try to load branches, then load repo tree
    this.loadBranches();
  }

  loadBranches() {
    if (!this.projectId) return;

    this.loading = true;
    this.errorMessage = '';
    
    this.githubService.getBranches(this.projectId).subscribe({
      next: (res: string) => {
        try {
          const parsedBranches = JSON.parse(res);
          if (Array.isArray(parsedBranches) && parsedBranches.length > 0) {
            // Make sure we have an array of strings for branch names
            this.branches = parsedBranches.map(branch => {
              // If branch is an object with a name property, return the name
              if (typeof branch === 'object' && branch !== null && 'name' in branch) {
                return branch.name;
              }
              // If branch is already a string, return it directly
              else if (typeof branch === 'string') {
                return branch;
              }
              // Otherwise, convert to string
              return String(branch);
            });
            this.currentBranch = this.branches[0];
          } else {
            // Fallback to default branches if response is invalid
            this.branches = ['main', 'master'];
            this.currentBranch = 'main';
          }
          this.loadRepoTree();
        } catch (error) {
          console.error('Error parsing branches response:', error, 'Raw response:', res);
          // Use fallback branches and continue
          this.branches = ['main', 'master'];
          this.currentBranch = 'main';
          this.loadRepoTree();
        }
      },
      error: (err) => {
        console.error('Error loading branches:', err);
        // Use fallback and try to load repo tree anyway
        this.branches = ['main', 'master'];
        this.currentBranch = 'main';
        this.loadRepoTree();
      }
    });
  }

  loadRepoTree(path: string = '') {
    if (!this.projectId) return;

    // Set loading state
    this.loading = true;
    if (path) {
      // If loading a subfolder, don't clear the error message for the whole view
    } else {
      // Only clear error message when loading root
      this.errorMessage = '';
    }
    
    this.githubService.getRepoTree(this.projectId, path).subscribe({
      next: (res: string) => {
        try {
          // Check if the response contains an error message
          if (res.includes('"error"') || res.startsWith('Error:')) {
            let errorMessage = 'Unknown error occurred';
            try {
              const errorResponse = JSON.parse(res) as GitHubErrorResponse;
              errorMessage = errorResponse.error;
            } catch {
              errorMessage = res;
            }
            console.error('GitHub API error:', errorMessage);
            this.errorMessage = this.extractErrorMessage(errorMessage);
            
            if (path) {
              // If this was a subfolder request that failed, just close the folder
              this.expandedFolders.delete(path);
            } else {
              // Clear the file tree only if the root request failed
              this.fileTree = [];
            }
          } else {
            const data = JSON.parse(res) as GitHubTreeResponse;
            
            if (path) {
              // We're loading a subfolder - add its contents to the parent folder's children
              const folderItems = data.tree || [];
              
              // Find the folder item in the existing tree
              const updateFolderWithChildren = (items: FileTreeItem[], folderPath: string, children: FileTreeItem[]): boolean => {
                for (let i = 0; i < items.length; i++) {
                  if (items[i].path === folderPath) {
                    items[i].children = children;
                    return true;
                  }
                  
                  // Check in children recursively if this item has children
                  const itemChildren = items[i].children;
                  if (itemChildren && Array.isArray(itemChildren) && itemChildren.length > 0) {
                    if (updateFolderWithChildren(itemChildren, folderPath, children)) {
                      return true;
                    }
                  }
                }
                return false;
              };
              
              // Try to update the folder with children
              const updated = updateFolderWithChildren(this.fileTree, path, folderItems);
              
              if (!updated) {
                // If we couldn't find the folder (which would be odd), just update the main tree
                console.warn('Could not find folder to update with children:', path);
                this.fileTree = folderItems;
              }
            } else {
              // We're loading the root folder
              this.fileTree = data.tree || [];
              this.errorMessage = '';
            }
          }
          this.filterFiles();
        } catch (error) {
          console.error('Error parsing repo tree response:', error, 'Raw response:', res);
          this.errorMessage = 'Failed to parse repository data';
          if (!path) {
            // Only clear the file tree if this was a root request
            this.fileTree = [];
          } else {
            // If this was a subfolder request that failed, just close the folder
            this.expandedFolders.delete(path);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading repo tree:', err);
        this.loading = false;
        this.errorMessage = this.getErrorMessage(err);
        
        if (!path) {
          // Only clear the file tree if this was a root request
          this.fileTree = [];
        } else {
          // If this was a subfolder request that failed, just close the folder
          this.expandedFolders.delete(path);
        }
        
        this.filterFiles();
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'Repository not found or access denied';
    } else if (error.status === 403) {
      return 'GitHub API rate limit exceeded. Please add a personal access token.';
    } else if (error.status === 401) {
      return 'Authentication failed. Please check your GitHub token.';
    } else if (error.status === 0) {
      return 'Network error. Please check your connection.';
    } else {
      return `Error loading repository: ${error.message || 'Unknown error'}`;
    }
  }

  extractErrorMessage(errorString: string): string {
    // Check for GitHub rate limit error
    if (errorString.includes('rate limit exceeded') || errorString.includes('403')) {
      return 'GitHub API rate limit exceeded. Please add a personal access token to increase your rate limit.';
    } else if (errorString.includes('404') || errorString.includes('Not Found')) {
      return 'Repository not found or you don\'t have access to it.';
    } else if (errorString.includes('401') || errorString.includes('Unauthorized')) {
      return 'Authentication failed. Please check your GitHub token.';
    }
    return 'Failed to load repository data: ' + errorString.substring(0, 100);
  }

  onBranchChange() {
    if (this.currentBranch) {
      this.selectedFile = null;
      this.selectedFileContent = '';
      this.expandedFolders.clear();
      this.loadRepoTree();
    }
  }

  onItemClick(item: FileTreeItem) {
    if (!item) return;

    if (item.type === 'tree') {
      this.toggleFolder(item.path);
    } else if (item.type === 'blob') {
      this.selectedFile = item;
      this.loadFileContent(item.path);
    }
  }

  loadFileContent(path: string) {
    if (!path || !this.projectId) return;

    console.log('Loading content for path:', path);
    this.errorMessage = '';
    this.selectedFileContent = 'Loading...';
    
    this.githubService.getFileContent(this.projectId, path).subscribe({
      next: (res: string) => {
        console.log('Received content for path:', path, 'Length:', res.length);
        
        if (res.includes('"error"') || res.startsWith('Error:')) {
          let errorMessage = 'Failed to load file content';
          try {
            const errorResponse = JSON.parse(res) as GitHubErrorResponse;
            errorMessage = this.extractErrorMessage(errorResponse.error);
          } catch {
            errorMessage = res.substring(0, 200);
          }
          this.selectedFileContent = `Error: ${errorMessage}`;
        } else if (res && res.trim()) {
          this.selectedFileContent = res;
        } else {
          console.warn('Empty or invalid content received for path:', path);
          this.selectedFileContent = 'No content available or file is empty.';
        }
      },
      error: (err) => {
        console.error('Error loading file content for path:', path, err);
        this.selectedFileContent = `Error loading content: ${this.getErrorMessage(err)}`;
      }
    });
  }

  toggleFolder(path: string) {
    if (this.expandedFolders.has(path)) {
      this.expandedFolders.delete(path);
    } else {
      this.expandedFolders.add(path);
      // Load folder contents when folder is expanded
      this.loadRepoTree(path);
    }
  }

  toggleTokenInput() {
    this.showTokenInput = !this.showTokenInput;
  }

  saveToken() {
    if (this.githubToken && this.githubToken.trim()) {
      try {
        // Save token to localStorage
        localStorage.setItem('github_token', this.githubToken);
        this.tokenSaved = true;
        this.githubService.setGithubToken(this.githubToken);
        this.showTokenInput = false;
        
        // Reload data with the new token
        if (this.isInitialized) {
          this.loadRepoTree();
        }
      } catch (error) {
        console.warn('Could not save GitHub token to localStorage:', error);
        // Still set the token in the service
        this.tokenSaved = true;
        this.githubService.setGithubToken(this.githubToken);
        this.showTokenInput = false;
      }
    }
  }

  clearToken() {
    try {
      localStorage.removeItem('github_token');
    } catch (error) {
      console.warn('Could not remove GitHub token from localStorage:', error);
    }
    
    this.githubToken = '';
    this.tokenSaved = false;
    this.githubService.clearGithubToken();
    
    // Optionally reload data without token
    if (this.isInitialized) {
      this.loadRepoTree();
    }
  }

  isExpanded(path: string): boolean {
    return this.expandedFolders.has(path);
  }

  getFileLanguage(fileName: string): string {
    if (!fileName) return 'Text';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'java': 'Java',
      'ts': 'TypeScript',
      'js': 'JavaScript',
      'jsx': 'React',
      'tsx': 'React/TS',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'py': 'Python',
      'md': 'Markdown',
      'json': 'JSON',
      'xml': 'XML',
      'yml': 'YAML',
      'yaml': 'YAML',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'kt': 'Kotlin',
      'swift': 'Swift',
      'sh': 'Shell',
      'sql': 'SQL'
    };
    return langMap[ext || ''] || 'Text';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = (now.getTime() - date.getTime()) / 1000;
      
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
      return `${Math.floor(diff / 604800)} weeks ago`;
    } catch (error) {
      return '';
    }
  }

  filterFiles() {
    if (!this.fileSearchTerm.trim()) {
      this.filteredFileTree = [...this.fileTree];
    } else {
      const searchTerm = this.fileSearchTerm.toLowerCase();
      this.filteredFileTree = this.fileTree.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.path.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Method to refresh the entire component
  refresh() {
    this.resetComponentState();
    this.loadSavedToken();
    this.loadRepositoryData();
  }

  // Copy file content to clipboard
  copyFileContent() {
    if (this.selectedFile && this.selectedFileContent) {
      const copied = this.clipboard.copy(this.selectedFileContent);
      console.log('File content copied to clipboard:', copied);
      
      // Create a temporary feedback element
      const feedbackEl = document.createElement('div');
      feedbackEl.textContent = 'Copied to clipboard!';
      feedbackEl.style.position = 'fixed';
      feedbackEl.style.bottom = '20px';
      feedbackEl.style.right = '20px';
      feedbackEl.style.padding = '10px 20px';
      feedbackEl.style.backgroundColor = '#4CAF50';
      feedbackEl.style.color = 'white';
      feedbackEl.style.borderRadius = '4px';
      feedbackEl.style.zIndex = '9999';
      feedbackEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      
      document.body.appendChild(feedbackEl);
      
      // Remove the feedback element after 2 seconds
      setTimeout(() => {
        document.body.removeChild(feedbackEl);
      }, 2000);
    }
  }
}