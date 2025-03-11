import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProjectService, Project } from '../../../services/project.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { diAngularOriginal, diSpringOriginal, diReactOriginal, diVuejsOriginal, diTypescriptOriginal, diNodejsOriginal, diJavaOriginal } from '@ng-icons/devicon/original';

@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [RouterModule, NgIcon, MatIconModule, CommonModule, FormsModule],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css'],
  viewProviders: [provideIcons({
    diAngularOriginal,
    diSpringOriginal,
    diVuejsOriginal,
    diTypescriptOriginal,
    diNodejsOriginal,
    diJavaOriginal,
    diReactOriginal
  })]
})
export class AddProjectComponent implements OnInit {
  selectedTechnology: string | null = null;
  isLoading = false;
  
  project: Project = {
    name: '',
    description: '',
    technologies: [],
    repositoryLink: '',
    deadlineDate: '',
    tags: []
  };

  constructor(
    private router: Router, 
    private projectService: ProjectService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Check if user is logged in and has admin role
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastr.error('Please log in to create a project');
      this.router.navigate(['/login']);
      return;
    }

    if (!['ADMIN', 'PARTNER'].includes(currentUser.role)) {
      this.toastr.error('You do not have permission to create projects');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Set default values for the project
    this.project = {
      name: '',
      description: '',
      technologies: [],
      repositoryLink: '',
      deadlineDate: '',
      tags: []
    };

    // Set default deadline date to one month from now
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    this.project.deadlineDate = date.toISOString().split('T')[0];
  }

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
  
  selectTechnology(tech: string) {
    this.selectedTechnology = tech;
    this.project.technologies = [tech];
    console.log('Selected technology:', tech);
  }

  onSubmit() {
    // Log form data before validation
    console.log('Form data before validation:', {
      name: this.project.name,
      description: this.project.description,
      technologies: this.project.technologies,
      repositoryLink: this.project.repositoryLink,
      deadlineDate: this.project.deadlineDate
    });

    if (!this.validateProject()) {
      return;
    }

    this.isLoading = true;
    
    // Create a copy of the project with trimmed values
    const projectToSubmit = {
      ...this.project,
      name: this.project.name.trim(),
      description: this.project.description.trim(),
      repositoryLink: this.project.repositoryLink.trim(),
      technologies: this.project.technologies,
      deadlineDate: this.project.deadlineDate,
      tags: this.project.tags || []
    };

    console.log('Submitting project:', projectToSubmit);
    
    this.projectService.createProject(projectToSubmit).subscribe({
      next: (result) => {
        console.log('Project created:', result);
        this.toastr.success('Project created successfully');
        this.router.navigate(['/dashboard/project']);
      },
      error: (error) => {
        console.error('Error creating project:', error);
        if (error.status === 403) {
          this.toastr.error('You do not have permission to create projects');
        } else {
          this.toastr.error(error.message || 'Failed to create project');
        }
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private validateProject(): boolean {
    if (!this.project.name.trim()) {
      this.toastr.error('Project name is required');
      return false;
    }
    if (!this.project.description.trim()) {
      this.toastr.error('Project description is required');
      return false;
    }
    if (!this.project.technologies.length) {
      this.toastr.error('Please select a technology');
      return false;
    }
    if (!this.project.repositoryLink.trim()) {
      this.toastr.error('Repository link is required');
      return false;
    }
    if (!this.project.deadlineDate) {
      this.toastr.error('Deadline date is required');
      return false;
    }
    return true;
  }
}
