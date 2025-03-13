import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService, Project } from '../../../services/project.service';
import { StaffService } from '../../../services/staff.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, MatButtonModule],
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.css']
})
export class ProjectDetailsComponent implements OnInit {
  project: Project = {
    id: 0,
    name: '',
    description: '',
    technologies: '',
    repositoryLink: '',
    deadlineDate: '',
    tags: []
  };
  
  members: User[] = [];
  availableStaff: User[] = [];

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private projectService: ProjectService,
    private staffService: StaffService
  ) {}

  onDashboardClick() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    const projectId = +this.route.snapshot.params['id'];
    if (projectId) {
      this.loadProjectDetails(projectId);
      this.loadProjectMembers(projectId);
      this.loadAvailableStaff();
    }
  }

  loadProjectDetails(projectId: number) {
    this.projectService.getProjectById(projectId).subscribe((project) => {
      this.project = project;
    });
  }

  loadProjectMembers(projectId: number) {
    this.projectService.getProjectMembers(projectId).subscribe((members) => {
      this.members = members;
    });
  }

  loadAvailableStaff() {
    this.staffService.getStaffByPartnerTenant().subscribe((staff) => {
      this.availableStaff = staff;
    });
  }

  addUserToProject(userId: number) {
    if (this.project.id) {
      this.projectService.addUserToProject(this.project.id, userId).subscribe(() => {
        // Reload both lists to keep them in sync
        this.loadProjectMembers(this.project.id!);
        this.loadAvailableStaff();
      });
    }
  }

  removeUserFromProject(userId: number) {
    if (this.project.id) {
      this.projectService.removeUserFromProject(this.project.id, userId).subscribe(() => {
        // Reload both lists to keep them in sync
        this.loadProjectMembers(this.project.id!);
        this.loadAvailableStaff();
      });
    }
  }

  isUserMember(userId: number): boolean {
    return this.members.some(member => member.id === userId);
  }
}
