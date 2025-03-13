import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule
  ],
  templateUrl: './project-settings.component.html',
  styleUrl: './project-settings.component.css'
})
export class ProjectSettingsComponent implements OnInit {
  projectId: number = 0;
  errorMessage: string = '';
  project: Project = new Project();
  projectTags: string[] = [];
  newTag: string = '';

  constructor(
    private router: Router, 
    private projectService: ProjectService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = +params['id'];
      this.loadProject();
    });
  }

  loadProject() {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (projectData) => {
        this.project = new Project(projectData);
        this.projectTags = [...this.project.tags];
      },
      error: (error: any) => {
        console.error('Error loading project:', error);
        this.errorMessage = 'Failed to load project details.';
      }
    });
  }

  addTag() {
    if (this.newTag.trim()) {
      if (!this.project.tags.includes(this.newTag.trim())) {
        this.project.tags.push(this.newTag.trim());
        this.projectTags = [...this.project.tags];
      }
      this.newTag = '';
    }
  }

  removeTag(tag: string) {
    const index = this.project.tags.indexOf(tag);
    if (index > -1) {
      this.project.tags.splice(index, 1);
      this.projectTags = [...this.project.tags];
    }
  }

  addDocUrl() {
    this.project.documentationUrls.push('');
  }

  removeDocUrl(index: number) {
    this.project.documentationUrls.splice(index, 1);
  }

  saveProject() {
    // Convert date to string format if it's a Date object
    const projectData = {
      ...this.project,
      deadlineDate: this.project.deadlineDate
    };

    this.projectService.updateProject(this.projectId, projectData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/project']);
      },
      error: (error: any) => {
        console.error('Error updating project:', error);
        this.errorMessage = 'Failed to update project. Please try again later.';
      }
    });
  }

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
 
  onDeleteProjectClick(projectId: number) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone. All associated data including developers, testers, and events will be permanently deleted.')) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          this.router.navigate(['/dashboard/project']);
        },
        error: (error: any) => {
          console.error('Error deleting project:', error);
          this.errorMessage = 'Failed to delete project. Please try again later.';
        }
      });
    }
  }
}
