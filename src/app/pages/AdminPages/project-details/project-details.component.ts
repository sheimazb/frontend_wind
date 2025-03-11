import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService, Project } from '../../../services/project.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule],
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

  constructor(private router: Router, private route: ActivatedRoute, private projectService: ProjectService) {}

  onDashboardClick() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    const projectId = +this.route.snapshot.params['id']; // Ensure it's a number
    if (projectId) {
      this.loadProjectDetails(projectId);
      this.loadProjectMembers(projectId);

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
}
