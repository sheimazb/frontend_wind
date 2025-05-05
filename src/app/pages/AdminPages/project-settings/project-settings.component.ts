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
import { MatSnackBar } from '@angular/material/snack-bar';

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
  logoPreview: string | null = null;

  constructor(
    private router: Router, 
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
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
    // Create FormData object
    const formData = new FormData();
    
    // Add basic fields one by one
    if (this.project.name) {
      formData.append('name', this.project.name);
    }
    if (this.project.description) {
      formData.append('description', this.project.description);
    }
    if (this.project.repositoryLink) {
      formData.append('repositoryLink', this.project.repositoryLink);
    }
    if (this.project.deadlineDate) {
      formData.append('deadlineDate', this.project.deadlineDate);
    }
    if (this.project.progressPercentage !== undefined && this.project.progressPercentage !== null) {
      formData.append('progressPercentage', this.project.progressPercentage.toString());
    }
    if (this.project.status) {
      formData.append('status', this.project.status);
    }
    if (this.project.priority) {
      formData.append('priority', this.project.priority);
    }
    
    // Handle technologies (convert array to string if needed)
    if (this.project.technologies) {
      if (Array.isArray(this.project.technologies)) {
        formData.append('technologies', JSON.stringify(this.project.technologies));
      } else {
        formData.append('technologies', this.project.technologies);
      }
    }
    
    // Handle primary tag (single tag)
    if (this.projectTags && this.projectTags.length > 0) {
      formData.append('primaryTag', this.projectTags[0]); // Use first tag as primary
    }
    
    // Handle tags array
    if (this.projectTags && this.projectTags.length > 0) {
      formData.append('tags', JSON.stringify(this.projectTags));
    }
    
    // Handle documentation URLs
    if (this.project.documentationUrls && this.project.documentationUrls.length > 0) {
      formData.append('documentationUrls', JSON.stringify(this.project.documentationUrls));
    }
    
    // Handle logo file if present
    if (this.project.logo instanceof File) {
      formData.append('logo', this.project.logo);
    }

    // Log the data being sent
    console.log('Saving project with data:', {
      name: this.project.name,
      description: this.project.description,
      technologies: this.project.technologies,
      primaryTag: this.projectTags[0],
      tags: this.projectTags,
      documentationUrls: this.project.documentationUrls
    });

    // Log FormData entries for debugging
    const formDataEntries = Array.from((formData as any).entries());
    console.log('FormData entries:', formDataEntries);

    this.projectService.updateProject(this.projectId, formData).subscribe({
      next: (response) => {
        console.log('Project updated successfully:', response);
        this.snackBar.open('Project saved successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/dashboard/project']);
      },
      error: (error: any) => {
        console.error('Error updating project:', error);
        this.errorMessage = 'Failed to update project. Please try again later.';
        this.snackBar.open('Failed to save project', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndPreviewLogo(file);
    }
  }

  private validateAndPreviewLogo(file: File) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Invalid file type. Please upload JPG, PNG, or SVG.';
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'File is too large. Maximum size is 2MB.';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      this.project.logo = file;
    };

    reader.onerror = () => {
      this.errorMessage = 'Error reading file. Please try again.';
    };

    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.logoPreview = null;
    this.project.logo = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.add('border-blue-500', 'dark:border-blue-400');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndPreviewLogo(file);
    }
  }
}
