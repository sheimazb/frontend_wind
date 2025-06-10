import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { StaffService } from '../../../services/staff.service';
import { LogService } from '../../../services/log.service';
import { User } from '../../../models/user.model';
import { Project } from '../../../models/project.model';
import { GitHubInterfaceComponent } from "../github-viewer/github-viewer.component";

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    GitHubInterfaceComponent
],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {
  project: Project = new Project();
  members: User[] = [];
  availableStaff: User[] = [];
  loading: boolean = true;
  selectedTabIndex: number = 0;

  // Table data sources
  membersDataSource = new MatTableDataSource<User>([]);
  staffDataSource = new MatTableDataSource<User>([]);

  // Table columns
  memberColumns: string[] = ['name', 'email', 'role', 'actions'];
  staffColumns: string[] = ['name', 'email', 'role', 'actions'];

  // Filters
  memberNameFilter: string = '';
  memberRoleFilter: string = '';
  staffNameFilter: string = '';
  staffRoleFilter: string = '';

  // Available roles
  roles: string[] = ['DEVELOPER', 'MANAGER', 'TESTER'];

  // Logs related properties
  filteredLogs: any[] = [];
  allLogs: any[] = [];
  priorityFilter: string = '';

  @ViewChild('memberSort') memberSort!: MatSort;
  @ViewChild('staffSort') staffSort!: MatSort;

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private projectService: ProjectService,
    private staffService: StaffService,
    private logService: LogService
  ) {}

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
  onEditButtonClick(){
    this.router.navigate(['/dashboard/project-settings/', this.project.id]);
  }
  ngOnInit(): void {
    const projectId = +this.route.snapshot.params['id'];
    if (projectId) {
      this.loadProjectDetails(projectId);
      this.loadProjectMembers(projectId);
      this.loadAvailableStaff();
    }

    // Set up custom filter predicates
    this.setupFilters();
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    const projectId = this.project.getId();
    
    if (this.selectedTabIndex === 0) { // Overview tab
      this.loadProjectMembers(projectId);
    } else if (this.selectedTabIndex === 1) { // Team Members tab
      this.loadProjectMembers(projectId);
      this.loadAvailableStaff();
    } else if (this.selectedTabIndex === 2) { // Logs tab
      this.loadProjectLogs();
    }
  }

  private setupFilters() {
    this.membersDataSource.filterPredicate = (data: User, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const nameMatch = !searchTerms.name || 
        `${data.firstname} ${data.lastname}`.toLowerCase().includes(searchTerms.name.toLowerCase()) ||
        data.email.toLowerCase().includes(searchTerms.name.toLowerCase());
      const roleMatch = !searchTerms.role || data.role === searchTerms.role;
      return nameMatch && roleMatch;
    };

    this.staffDataSource.filterPredicate = (data: User, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const nameMatch = !searchTerms.name || 
        `${data.firstname} ${data.lastname}`.toLowerCase().includes(searchTerms.name.toLowerCase()) ||
        data.email.toLowerCase().includes(searchTerms.name.toLowerCase());
      const roleMatch = !searchTerms.role || data.role === searchTerms.role;
      return nameMatch && roleMatch;
    };
  }

  ngAfterViewInit() {
    this.membersDataSource.sort = this.memberSort;
    this.staffDataSource.sort = this.staffSort;
  }

  loadProjectDetails(projectId: number) {
    this.loading = true;
    this.projectService.getProjectById(projectId).subscribe({
      next: (projectData) => {
        this.project = new Project(projectData);
        this.updateProjectStats();
      },
      error: (error) => {
        console.error('Error loading project details:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private updateProjectStats() {
    // Calculate task statistics
    const totalTasks = this.project.totalTasks || 0;
    const completedTasks = this.project.completedTasks || 0;
    const inProgressTasks = this.project.inProgressTasks || 0;
    
    // Update progress percentage if not set
    if (!this.project.progressPercentage && totalTasks > 0) {
      this.project.progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    }

    // Set default values for project properties
    this.project.status = this.project.status || 'Active';
    this.project.priority = this.project.priority || 'Medium';
    this.project.technologies = this.project.technologies || [];
    this.project.tags = this.project.tags || [];
    this.project.documentationUrls = this.project.documentationUrls || [];
    this.project.projectUsers = this.project.projectUsers || [];
    this.project.membersCount = this.project.projectUsers.length;
  }

  loadProjectMembers(projectId: number) {
    if (!projectId) return;
    
    this.projectService.getProjectMembers(projectId).subscribe({
      next: (members) => {
        this.members = members;
        this.membersDataSource.data = members;
        this.project.membersCount = members.length;
        this.applyMemberFilters();
      },
      error: (error) => {
        console.error('Error loading project members:', error);
      }
    });
  }

  loadAvailableStaff() {
    this.staffService.getStaffByPartnerTenant().subscribe({
      next: (staff) => {
        this.availableStaff = staff;
        this.staffDataSource.data = staff.filter(s => !this.members.some(m => m.id === s.id));
        this.applyStaffFilters();
      },
      error: (error) => {
        console.error('Error loading available staff:', error);
      }
    });
  }

  addUserToProject(userId: number) {
    const projectId = this.project.getId();
    if (projectId) {
      this.projectService.addUserToProject(projectId, userId).subscribe({
        next: () => {
          this.loadProjectMembers(projectId);
          this.loadAvailableStaff();
        },
        error: (error) => {
          console.error('Error adding user to project:', error);
        }
      });
    }
  }

  removeUserFromProject(userId: number) {
    const projectId = this.project.getId();
    if (projectId) {
      this.projectService.removeUserFromProject(projectId, userId).subscribe({
        next: () => {
          this.loadProjectMembers(projectId);
          this.loadAvailableStaff();
        },
        error: (error) => {
          console.error('Error removing user from project:', error);
        }
      });
    }
  }

  isUserMember(userId: number): boolean {
    return this.members.some(member => member.id === userId);
  }

  // Filter handlers
  applyMemberFilters() {
    try {
      const filterValue = JSON.stringify({
        name: this.memberNameFilter?.trim() || '',
        role: this.memberRoleFilter || ''
      });
      this.membersDataSource.filter = filterValue;
    } catch (error) {
      console.error('Error applying member filters:', error);
    }
  }

  applyStaffFilters() {
    try {
      const filterValue = JSON.stringify({
        name: this.staffNameFilter?.trim() || '',
        role: this.staffRoleFilter || ''
      });
      this.staffDataSource.filter = filterValue;
    } catch (error) {
      console.error('Error applying staff filters:', error);
    }
  }

  clearMemberFilters() {
    this.memberNameFilter = '';
    this.memberRoleFilter = '';
    this.applyMemberFilters();
  }

  clearStaffFilters() {
    this.staffNameFilter = '';
    this.staffRoleFilter = '';
    this.applyStaffFilters();
  }

  // Get full name helper
  getFullName(user: User): string {
    return user ? `${user.firstname} ${user.lastname}` : '';
  }

  // Logs related methods
  loadProjectLogs() {
    const projectId = this.project.getId();
    if (!projectId) return;
    
    this.loading = true;
    this.logService.getLogsByProjectId(projectId.toString()).subscribe({
      next: (logs: any[]) => {
        this.allLogs = logs;
        this.filteredLogs = [...this.allLogs];
        this.applyIssueFilters();
      },
      error: (error: any) => {
        console.error('Error loading project logs:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  applyIssueFilters() {
    this.filteredLogs = this.allLogs.filter(log => {
      if (this.priorityFilter && log.severity !== this.priorityFilter) {
        return false;
      }
      return true;
    });
  }

  getHighPriorityFilteredCount(): number {
    return this.filteredLogs.filter(log => log.severity === 'HIGH').length;
  }

  getMediumPriorityFilteredCount(): number {
    return this.filteredLogs.filter(log => log.severity === 'MEDIUM').length;
  }

  getLowPriorityFilteredCount(): number {
    return this.filteredLogs.filter(log => log.severity === 'LOW').length;
  }

  updatePriority(log: any) {
    // Implement priority update logic
    console.log('Update priority for log:', log);
  }

  onIssueClick(logId: number) {
   // Navigate to issue details if permission check passes
   this.router.navigate(['dashboard', 'issues-details', logId]);
  }
}
