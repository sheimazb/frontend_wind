import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-add-staff-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="p-6 dark:bg-gray-800">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add Project to Staff Member</h2>
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 rounded-lg p-4 mb-6">
        <p class="text-red-600 dark:text-red-400">{{ errorMessage }}</p>
      </div>

      <!-- Projects Grid -->
      <div *ngIf="!isLoading" class="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto">
        <div *ngFor="let project of availableProjects" 
             class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ project.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ project.description }}</p>
            </div>
            <button 
              (click)="addToProject(project)"
              class="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Add
            </button>
          </div>
        </div>

        <!-- No Projects Message -->
        <div *ngIf="availableProjects.length === 0" class="text-center py-8">
          <mat-icon class="text-4xl text-gray-400 mb-2">folder_off</mat-icon>
          <p class="text-gray-500 dark:text-gray-400">No available projects found</p>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div class="mt-6 flex justify-end">
        <button 
          (click)="onCancel()"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  `
})
export class AddStaffProjectDialogComponent implements OnInit {
  availableProjects: Project[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private dialogRef: MatDialogRef<AddStaffProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { staffId: number },
    private projectService: ProjectService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadAvailableProjects();
  }

  loadAvailableProjects() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Get all projects and filter out the ones the staff is already a member of
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.availableProjects = projects;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.errorMessage = 'Failed to load available projects';
        this.isLoading = false;
      }
    });
  }

  addToProject(project: Project) {
    this.isLoading = true;
    this.projectService.addUserToProject(project.getId(), this.data.staffId).subscribe({
      next: () => {
        this.toastr.success('Successfully added to project');
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error adding to project:', error);
        this.toastr.error('Failed to add to project');
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}