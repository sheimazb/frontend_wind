import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogStaffComponent } from '../../../dialog/dialog-staff/dialog-staff.component';
import { StaffService } from '../../../../services/staff.service';
import { StatsService } from '../../../../services/stats.service';
import { User } from '../../../../models/user.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { ProjectService } from '../../../../services/project.service';
import { Project } from '../../../../models/project.model';

@Component({
  selector: 'app-content-staff',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './content-staff.component.html',
  styleUrls: ['./content-staff.component.css']
})
export class ContentStaffComponent implements OnInit {
  staff: User[] = [];
  filteredStaff: User[] = [];
  isLoading = true;
  errorMessage = '';
  searchQuery = '';
  selectedRole: string = 'ALL';
  viewMode: 'grid' | 'list' = 'grid';
  
  // Map to store project counts for each user
  userProjectsMap: Map<number, Project[]> = new Map();
  loadingProjectsMap: Map<number, boolean> = new Map();

  constructor(
    private dialog: MatDialog,
    private staffService: StaffService,
    private router: Router,
    private statsService: StatsService,
    private authService: AuthService,
    private projectService: ProjectService
  ) {
    // Load saved view mode preference
    const savedViewMode = localStorage.getItem('staffViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.staffService.getStaffByPartnerTenant().subscribe({
      next: (staffList) => {
        // Sort staff by ID in descending order (newest first)
        this.staff = staffList.sort((a, b) => {
          // Assuming id is a number. If it's a string, use localeCompare
          return (b.id ?? 0) - (a.id ?? 0);
        });
        
        this.applyFilters();
        this.isLoading = false;
        
        // Load project data for each staff member
        this.staff.forEach(user => {
          if (user.id) {
            this.loadUserProjects(user.id);
          }
        });
      },
      error: (error) => {
        console.error('Error loading staff:', error);
        this.errorMessage = 'Failed to load staff members. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  loadUserProjects(userId: number): void {
    this.loadingProjectsMap.set(userId, true);
    
    this.projectService.getUserProjects(userId).pipe(
      catchError(error => {
        console.error(`Error fetching projects for user ${userId}:`, error);
        return of([]);
      })
    ).subscribe(projects => {
      this.userProjectsMap.set(userId, projects);
      this.loadingProjectsMap.set(userId, false);
    });
  }
  
  // Helper methods to get project data for a user
  isLoadingProjects(userId?: number): boolean {
    if (!userId) return false;
    return this.loadingProjectsMap.get(userId) || false;
  }
  
  getProjectCount(userId?: number): number {
    if (!userId) return 0;
    const projects = this.userProjectsMap.get(userId);
    return projects ? projects.length : 0;
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogStaffComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadStaff();
      }
    });
  }

  onSearchStaff(event: any): void {
    this.searchQuery = event.target.value;
    this.applyFilters();
  }

  onRoleFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.staff];

    // Apply search filter
    if (this.searchQuery.trim()) {
      filtered = this.staffService.searchStaff(filtered, this.searchQuery);
    }

    // Apply role filter
    if (this.selectedRole !== 'ALL') {
      filtered = this.staffService.filterStaffByRole(filtered, this.selectedRole);
    }

    this.filteredStaff = filtered;
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    localStorage.setItem('staffViewMode', this.viewMode);
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'DEVELOPER':
        return 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'TESTER':
        return 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'MANAGER':
        return 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  onStaffDetailsClick(id: number): void {
    this.router.navigate(['/dashboard/staff-details', id]);
  }
}
