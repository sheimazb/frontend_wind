import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { StaffService } from '../../../services/staff.service';
import { ProjectService, Project } from '../../../services/project.service';

@Component({
  selector: 'app-staff-details',
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    CommonModule
  ],
  templateUrl: './staff-details.component.html',
  styleUrl: './staff-details.component.css'
})
export class StaffDetailsComponent implements OnInit {
  constructor(
    private router: Router, 
    private staffService: StaffService, 
    private projectService: ProjectService,
    private route: ActivatedRoute
  ) {}

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

  onDashboardClick() {
    this.router.navigate(['/dashboard/staff']);
  }

  onStaffTicketClick() {
    this.router.navigate(['/dashboard/staff-ticket']);
  }

  onProjectClick(projectId: number) {
    this.router.navigate(['/dashboard/project-details', projectId]);
  }
}
