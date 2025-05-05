import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../services/project.service';
import { Project } from '../../../models/project.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  diAngularOriginal, 
  diSpringOriginal, 
  diReactOriginal, 
  diVuejsOriginal, 
  diTypescriptOriginal, 
  diNodejsOriginal, 
  diJavaOriginal ,
  diDotnetcoreOriginal  
} from '@ng-icons/devicon/original';
import { 
  heroCloudArrowUp, 
  heroTrash,
  heroPhoto,
  heroCheckCircle,
  heroXCircle
} from '@ng-icons/heroicons/outline';

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
    diReactOriginal,
    diDotnetcoreOriginal,
    heroCloudArrowUp,
    heroTrash,
    heroPhoto,
    heroCheckCircle,
    heroXCircle
  })]
})
export class AddProjectComponent implements OnInit, OnDestroy {
  selectedTechnology: string | null = null;
  isLoading = false;
  logoPreview: string | null = null;
  logoFile: File | null = null;
  currentUser: any = null;
  tagSuggestions: string[] = [];
  isTagAvailable: boolean | null = null;
  
  project: Project = new Project({
    name: '',
    description: '',
    technologies: [],
    repositoryLink: '',
    projectTag: '',
    deadlineDate: new Date().toISOString().split('T')[0],
    tags: [],
    progressPercentage: 0,
    status: 'Active',
    priority: 'Medium'
  });

  private tagInputSubject = new Subject<string>();
  private tagSubscription?: Subscription;
  isCheckingTag = false;

  constructor(
    private router: Router, 
    private projectService: ProjectService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    // Setup tag input debounce
    this.tagSubscription = this.tagInputSubject.pipe(
      debounceTime(300), // Wait for 300ms pause in events
      distinctUntilChanged() // Only emit if value changed
    ).subscribe(async (tag) => {
      if (tag.trim()) {
        await this.checkTagAndSuggest(tag);
      } else {
        this.tagSuggestions = [];
      }
    });
  }

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
  
      // Set default deadline date to one month from now
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      this.project.deadlineDate = date.toISOString().split('T')[0];
      this.project.dueDate = this.project.deadlineDate;
    }
  

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
  
  selectTechnology(tech: string) {
    this.selectedTechnology = tech;
    this.project.technologies = [tech];
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
    if (!this.project.projectTag.trim()) {
      this.toastr.error('Project tag is required');
      return false;
    }
    if (!this.project.deadlineDate) {
      this.toastr.error('Deadline date is required');
      return false;
    }
    return true;
  }

  private generateTagSuggestions(baseTag: string): string[] {
    const suggestions: string[] = [];
    const maxSuggestions = 5;
    
    // Add a number suffix
    for (let i = 2; i <= maxSuggestions; i++) {
      if (baseTag.includes('.')) {
        const [name, ext] = baseTag.split('.');
        suggestions.push(`${name}${i}.${ext}`);
      } else {
        suggestions.push(`${baseTag}${i}`);
      }
    }
    
    // Add random suffixes
    for (let i = 0; i < 2; i++) {
      const randomSuffix = Math.random().toString(36).substring(2, 5);
      if (baseTag.includes('.')) {
        const [name, ext] = baseTag.split('.');
        suggestions.push(`${name}-${randomSuffix}.${ext}`);
      } else {
        suggestions.push(`${baseTag}-${randomSuffix}`);
      }
    }
    
    return suggestions;
  }

  private async findAvailableTag(suggestions: string[]): Promise<string | null> {
    for (const tag of suggestions) {
      try {
        const exists = await firstValueFrom(
          this.projectService.checkPrimaryTagExists(tag)
        );
        if (!exists) {
          return tag;
        }
      } catch (error) {
        console.error('Error checking tag suggestion:', error);
      }
    }
    return null;
  }

  private async checkTagExistence(): Promise<boolean> {
    if (!this.project.projectTag.trim()) {
      return false;
    }

    try {
      const tagExists = await firstValueFrom(
        this.projectService.checkPrimaryTagExists(this.project.projectTag.trim())
      );
      if (tagExists) {
        // Generate suggestions and find available ones
        const suggestions = this.generateTagSuggestions(this.project.projectTag.trim());
        const availableTag = await this.findAvailableTag(suggestions);
        
        let errorMessage = 'This project tag already exists.';
        if (availableTag) {
          errorMessage += ` You might want to try: "${availableTag}"`;
          this.tagSuggestions = [availableTag];
        } else {
          this.tagSuggestions = [];
        }
        
        this.toastr.error(errorMessage, 'Tag Already Exists', {
          timeOut: 5000, // Give users more time to read the suggestion
        });
        return false;
      }
      this.tagSuggestions = []; // Clear suggestions if tag is valid
      return true;
    } catch (error) {
      console.error('Error checking tag existence:', error);
      this.toastr.error('Error checking tag availability. Please try again.');
      return false;
    }
  }

  // Add a method to apply a suggested tag
  applyTagSuggestion(suggestion: string) {
    this.project.projectTag = suggestion;
    this.tagSuggestions = []; // Clear suggestions after applying
    this.isTagAvailable = true; // Set tag as available since suggestions are pre-verified
    this.toastr.success('Tag suggestion applied and available for use');
  }

  async onSubmit() {
    if (!this.validateProject()) {
      return;
    }

    // Check if the tag already exists
    const isTagValid = await this.checkTagExistence();
    if (!isTagValid) {
      return;
    }

    // Check if user is still authenticated
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastr.error('Your session has expired. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    // Log the current state before submission
    console.log('Submitting project:', {
      user: currentUser,
      projectData: this.project,
      hasLogo: !!this.logoFile
    });

    this.isLoading = true;
    
    // Create FormData object according to the requested format
    const formData = new FormData();
    
    // Add basic fields
    formData.append('name', this.project.name.trim());
    formData.append('description', this.project.description.trim());
    formData.append('repositoryLink', this.project.repositoryLink.trim());
    formData.append('primaryTag', this.project.projectTag.trim());
    formData.append('deadlineDate', this.project.deadlineDate);
    formData.append('progressPercentage', this.project.progressPercentage.toString());
    formData.append('status', this.project.status);
    formData.append('priority', this.project.priority);
    
    // Add creator information
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      if (userData && userData.id) {
        formData.append('creatorId', userData.id.toString());
      }
    }
    
    // Handle technologies as an array
    if (this.project.technologies && this.project.technologies.length > 0) {
      // Option 1: As a comma-separated string
      formData.append('technologies', this.project.technologies.join(', '));
      
      // Option 2: As an array with indexed naming
      this.project.technologies.forEach((tech, index) => {
        formData.append(`technologiesArray[${index}]`, tech);
      });
    }
    
    // Handle tags
    if (this.project.tags && this.project.tags.length > 0) {
      this.project.tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });
    }
    
 
    // Add logo if exists - ensure proper handling
    if (this.logoFile) {
      // Explicitly set the filename and content type
      formData.append('logo', this.logoFile, this.logoFile.name);
    }

    // Log the FormData entries for debugging
    console.log('FormData entries:');
    // Use type assertion to any to access entries method
    const formDataAny = formData as any;
    if (formDataAny.entries) {
      for (const pair of formDataAny.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
    }

    this.projectService.createProject(formData).subscribe({
      next: (result) => {
        console.log('Project created successfully:', result);
        this.toastr.success('Project created successfully');
        this.router.navigate(['/dashboard/project']);
      },
      error: (error) => {
        console.error('Error creating project:', {
          error: error,
          status: error.status,
          message: error.message
        });
        
        if (error.status === 403) {
          this.toastr.error('You do not have permission to create projects');
          this.router.navigate(['/dashboard']);
        } else if (error.status === 401) {
          this.toastr.error('Your session has expired. Please log in again.');
          this.router.navigate(['/login']);
        } else {
          this.toastr.error(error.error?.message || 'Failed to create project. Please try again.');
        }
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.project = new Project({
      name: '',
      description: '',
      technologies: [],
      repositoryLink: '',
      projectTag: '',
      deadlineDate: new Date().toISOString().split('T')[0],
      tags: [],
      progressPercentage: 0,
      status: 'Active',
      priority: 'Medium'
    });
    this.logoPreview = null;
    this.logoFile = null;
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
      this.toastr.error('Invalid file type. Please upload JPG, PNG, or SVG.');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      this.toastr.error('File is too large. Maximum size is 2MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      this.logoFile = file; // Store the file for form submission
    };

    reader.onerror = () => {
      this.toastr.error('Error reading file. Please try again.');
    };

    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.logoPreview = null;
    this.logoFile = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Add visual feedback
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.add('border-blue-500', 'dark:border-blue-400');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Remove visual feedback
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove visual feedback
    const dropZone = event.currentTarget as HTMLElement;
    dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndPreviewLogo(file);
    }
  }

  ngOnDestroy() {
    this.tagSubscription?.unsubscribe();
  }

  // Add this new method for real-time tag input handling
  onTagInput(event: any) {
    const value = event.target.value;
    this.tagInputSubject.next(value);
  }

  private async checkTagAndSuggest(tag: string) {
    this.isCheckingTag = true;
    this.isTagAvailable = null; // Reset status while checking
    
    try {
      if (!tag.trim()) {
        this.tagSuggestions = [];
        this.isTagAvailable = null;
        return;
      }

      const tagExists = await firstValueFrom(
        this.projectService.checkPrimaryTagExists(tag.trim())
      );
      
      this.isTagAvailable = !tagExists;
      
      if (tagExists) {
        const suggestions = this.generateTagSuggestions(tag.trim());
        const availableTags = await this.findMultipleAvailableTags(suggestions);
        this.tagSuggestions = availableTags;
      } else {
        this.tagSuggestions = []; // Clear suggestions if tag is valid
      }
    } catch (error) {
      console.error('Error checking tag:', error);
      this.isTagAvailable = null;
    } finally {
      this.isCheckingTag = false;
    }
  }

  private async findMultipleAvailableTags(suggestions: string[]): Promise<string[]> {
    const availableTags: string[] = [];
    
    for (const tag of suggestions) {
      try {
        const exists = await firstValueFrom(
          this.projectService.checkPrimaryTagExists(tag)
        );
        if (!exists) {
          availableTags.push(tag);
          if (availableTags.length >= 3) { // Limit to 3 suggestions
            break;
          }
        }
      } catch (error) {
        console.error('Error checking tag suggestion:', error);
      }
    }
    
    return availableTags;
  }

  // Add method to get status classes
  getTagStatusClasses(): { [key: string]: boolean } {
    return {
      'border-green-500 dark:border-green-500': this.isTagAvailable === true,
      'border-red-500 dark:border-red-500': this.isTagAvailable === false,
      'border-gray-300 dark:border-gray-600': this.isTagAvailable === null
    };
  }
}
