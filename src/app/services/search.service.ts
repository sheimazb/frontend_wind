import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export interface SearchSuggestion {
  label: string;
  route: string;
  guard?: string[];
  icon?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchItems: SearchSuggestion[] = [
    // Admin Routes
    { 
      label: 'Admin Dashboard', 
      route: '/dashboard/admin',
      guard: ['adminGuard'],
      icon: 'admin_panel_settings',
      description: 'Access admin control panel'
    },
    { 
      label: 'Agencies Management', 
      route: '/dashboard/agencies',
      guard: ['adminGuard'],
      icon: 'business',
      description: 'Manage agency settings and configurations'
    },

    // Partner Routes
    { 
      label: 'Projects', 
      route: '/dashboard/project',
      guard: ['partnerGuard'],
      icon: 'folder',
      description: 'View and manage all projects'
    },
    { 
      label: 'Staff Management', 
      route: '/dashboard/staff',
      guard: ['partnerGuard'],
      icon: 'people',
      description: 'Manage staff members and roles'
    },
    { 
      label: 'Statistics', 
      route: '/dashboard/stats',
      guard: ['partnerGuard'],
      icon: 'analytics',
      description: 'View project statistics and analytics'
    },
    { 
      label: 'Alerts', 
      route: '/dashboard/alert',
      guard: ['partnerGuard'],
      icon: 'notifications',
      description: 'View system alerts and notifications'
    },
    { 
      label: 'Add Project', 
      route: '/dashboard/add-project',
      guard: ['partnerGuard'],
      icon: 'add_circle',
      description: 'Create a new project'
    },

    // Manager Routes
    { 
      label: 'Project Management', 
      route: '/dashboard/project-management',
      guard: ['managerGuard'],
      icon: 'manage_accounts',
      description: 'Manage project details and settings'
    },

    // Technical Team Routes
    { 
      label: 'Technical Resources', 
      route: '/dashboard/technical-resources',
      guard: ['technicalTeamGuard'],
      icon: 'engineering',
      description: 'Access technical documentation and resources'
    },
    { 
      label: 'Tickets', 
      route: '/dashboard/ticket-list',
      guard: ['technicalTeamGuard'],
      icon: 'assignment',
      description: 'View and manage tickets'
    },
    { 
      label: 'Kanban Board', 
      route: '/dashboard/kanban',
      icon: 'view_kanban',
      description: 'View project tasks in kanban format'
    },

    // Developer Routes
    { 
      label: 'Tasks', 
      route: '/dashboard/tasks',
      guard: ['developerGuard'],
      icon: 'task',
      description: 'View and manage development tasks'
    },

    // Tester Routes
    { 
      label: 'Issues', 
      route: '/dashboard/issues',
      guard: ['issuesGuard'],
      icon: 'bug_report',
      description: 'Track and manage issues'
    },

    // Common Routes (available to all authenticated users)
    { 
      label: 'Profile', 
      route: '/dashboard/profile',
      icon: 'person',
      description: 'View and edit your profile'
    },
    { 
      label: 'Dashboard', 
      route: '/dashboard',
      icon: 'dashboard',
      description: 'Go to main dashboard'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  getSuggestions(query: string): SearchSuggestion[] {
    if (!query) return [];
    
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser?.role || '';
    
    query = query.toLowerCase();
    
    // Filter suggestions based on user role and search query
    return this.searchItems.filter(item => {
      // Check if the item matches the search query
      const matchesQuery = item.label.toLowerCase().includes(query) ||
                          item.description?.toLowerCase().includes(query);
      
      // If no guards are specified, the item is available to all authenticated users
      if (!item.guard) {
        return matchesQuery;
      }

      // Check if user has permission based on guards
      const hasPermission = this.checkPermission(userRole, item.guard);
      
      return matchesQuery && hasPermission;
    });
  }

  private checkPermission(userRole: string, guards: string[]): boolean {
    // Map of roles and their corresponding guards
    const roleGuardMap: { [key: string]: string[] } = {
      'ADMIN': ['adminGuard','agenciesGuard'],
      'PARTNER': ['partnerGuard','staffGuard', 'issuesGuard', 'issueDetailsGuard'],
      'MANAGER': ['managerGuard', 'issuesGuard', 'issueDetailsGuard', 'technicalTeamGuard'],
      'DEVELOPER': ['developerGuard', 'technicalTeamGuard', 'issuesGuard', 'issueDetailsGuard'],
      'TESTER': ['issuesGuard', 'issueDetailsGuard', 'technicalTeamGuard']
    };

    // Get the guards available to the user's role
    const availableGuards = roleGuardMap[userRole] || [];

    // Check if any of the required guards match the user's available guards
    return guards.some(guard => availableGuards.includes(guard));
  }

  navigateToSuggestion(suggestion: SearchSuggestion) {
    this.router.navigate([suggestion.route]);
  }
} 