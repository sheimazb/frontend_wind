import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { StaffService } from '../../../services/staff.service';
import { ProjectService } from '../../../services/project.service';
import { User } from '../../../models/user.model';
import { Project } from '../../../models/project.model';
import { AddStaffProjectDialogComponent } from '../../../components/dialog/add-staff-project-dialog/add-staff-project-dialog.component';

@Component({
  selector: 'app-staff-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './staff-details.component.html',
  styleUrl: './staff-details.component.css'
})
export class StaffDetailsComponent implements OnInit {
  staff: User = {
    id: 0,
    firstname: '',
    lastname: '',
    email: '',
    role: '',
    pronouns: '',
    bio: '',
    location: '',   
    lien: '',
    company: '',
    phone: '',
    image: ''
  };

  staffProjects: Project[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private staffService: StaffService,
    private projectService: ProjectService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadStaffDetails();
  }

  loadStaffDetails() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading = true;
      // Load staff details
      this.staffService.getStaffById(id).subscribe({
        next: (data) => {
          this.staff = data;
          // After loading staff details, load their projects
          this.loadStaffProjects(this.staff.id);
        },
        error: (error) => {
          this.errorMessage = 'Failed to load staff details';
          this.isLoading = false;
        }
      });
    }
  }

  loadStaffProjects(userId: number) {
    this.projectService.getUserProjects(userId).subscribe({
      next: (projects) => {
        this.staffProjects = projects;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load staff projects';
        this.isLoading = false;
      }
    });
  }

  openAddProjectDialog() {
    const dialogRef = this.dialog.open(AddStaffProjectDialogComponent, {
      width: '600px',
      data: { staffId: this.staff.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStaffProjects(this.staff.id);
      }
    });
  }

  onProjectClick(projectId: number) {
    this.router.navigate(['/dashboard/project-details', projectId]);
  }

  // Added missing methods to fix linter errors
  onDashboardClick() {
    this.router.navigate(['/dashboard']);
  }

  onViewTickets(projectId: number) {
    this.router.navigate(['/dashboard/project-details', projectId, 'tickets']);
  }

  getTechnologies(technologies: string | string[]): string[] {
    if (typeof technologies === 'string') {
      return technologies.split(',').map(tech => tech.trim());
    }
    return technologies || [];
  }
}
