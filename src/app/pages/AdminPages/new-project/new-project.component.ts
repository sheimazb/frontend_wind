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
  diJavaOriginal,
  diDotnetcoreOriginal  
} from '@ng-icons/devicon/original';
import { 
  heroCloudArrowUp, 
  heroTrash,
  heroPhoto,
  heroCheckCircle,
  heroXCircle,
  heroArrowRight,
  heroArrowLeft,
  heroCheck,
  heroServerStack,
  heroSquare3Stack3d
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-new-project',
  standalone: true,
  imports: [RouterModule, NgIcon, MatIconModule, CommonModule, FormsModule],
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.css'],
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
    heroXCircle,
    heroArrowRight,
    heroArrowLeft,
    heroCheck,
    heroServerStack,
    heroSquare3Stack3d
  })]
})
export class NewProjectComponent implements OnInit, OnDestroy {
  // Stepper control
  currentStep: number = 1;
  selectedArchitecture: 'monolithic' | 'microservice' | null = null;
  
  // Existing properties
  selectedTechnology: string | null = null;
  isLoading = false;
  logoPreview: string | null = null;
  logoFile: File | null = null;
  currentUser: any = null;
  tagSuggestions: string[] = [];
  isTagAvailable: boolean | null = null;
  
  // Package related properties for microservice architecture
  package: any = {
    name: '',
    description: '',
    repositoryLink: '',
    deadlineDate: new Date().toISOString().split('T')[0],
  };
  
  // Microservice properties
  microservices: any[] = [];
  currentMicroservice: any = {
    name: '',
    description: '',
    technologies: [],
    projectTag: ''
  };
  
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
    
    // Initialize package deadline to the same default
    this.package.deadlineDate = this.project.deadlineDate;
  }
  
  // Stepper navigation functions
  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }
  
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  goToStep(step: number) {
    if (step >= 1 && step <= 3) {
      this.currentStep = step;
    }
  }
  
  // Architecture selection
  selectArchitecture(arch: 'monolithic' | 'microservice') {
    this.selectedArchitecture = arch;
  }
  
  // Microservice functions
  addMicroservice() {
    // Validate the current microservice
    if (this.validateMicroservice()) {
      this.microservices.push({...this.currentMicroservice});
      // Reset form for next microservice
      this.currentMicroservice = {
        name: '',
        description: '',
        technologies: [],
        projectTag: ''
      };
      this.selectedTechnology = null;
      this.toastr.success('Microservice added successfully');
    }
  }
  
  validateMicroservice(): boolean {
    if (!this.currentMicroservice.name.trim()) {
      this.toastr.error('Microservice name is required');
      return false;
    }
    if (!this.currentMicroservice.description.trim()) {
      this.toastr.error('Microservice description is required');
      return false;
    }
    if (!this.currentMicroservice.technologies.length) {
      this.toastr.error('Please select a technology');
      return false;
    }
    if (!this.currentMicroservice.projectTag.trim()) {
      this.toastr.error('Microservice tag is required');
      return false;
    }
    return true;
  }
  
  // Final submission handling
  async onFinalSubmit() {
    if (this.selectedArchitecture === 'monolithic') {
      await this.onSubmit();
    } else {
      await this.createPackageWithMicroservices();
    }
  }
  
  // Create microservice package and services
  async createPackageWithMicroservices() {
    // For now, this is just a placeholder for the actual implementation
    this.isLoading = true;
    
    try {
      // Validate the package
      if (!this.package.name.trim()) {
        this.toastr.error('Package name is required');
        this.isLoading = false;
        return;
      }
      
      if (!this.package.description.trim()) {
        this.toastr.error('Package description is required');
        this.isLoading = false;
        return;
      }
      
      if (!this.package.repositoryLink.trim()) {
        this.toastr.error('Repository link is required');
        this.isLoading = false;
        return;
      }
      
      if (this.microservices.length === 0) {
        this.toastr.error('At least one microservice is required');
        this.isLoading = false;
        return;
      }
      
      // In a real implementation, you would:
      // 1. Create the package
      // 2. Create all microservices and associate them with the package
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.toastr.success('Microservice package created successfully');
      this.router.navigate(['/dashboard/project']);
    } catch (error) {
      console.error('Error creating microservice package:', error);
      this.toastr.error('Failed to create microservice package');
    } finally {
      this.isLoading = false;
    }
  }

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
  
  selectTechnology(tech: string) {
    this.selectedTechnology = tech;
    
    if (this.selectedArchitecture === 'monolithic') {
      this.project.technologies = [tech];
    } else {
      this.currentMicroservice.technologies = [tech];
    }
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

    // Check if tag exists
    if (!(await this.checkTagExistence())) {
      return;
    }

    this.isLoading = true;

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all project fields
      formData.append('name', this.project.name);
      formData.append('description', this.project.description);
      formData.append('technologies', JSON.stringify(this.project.technologies));
      formData.append('repositoryLink', this.project.repositoryLink);
      formData.append('projectTag', this.project.projectTag);
      formData.append('deadlineDate', this.project.deadlineDate);
      formData.append('tags', JSON.stringify(this.project.tags));
      formData.append('priority', this.project.priority);
      
      // Add logo if available
      if (this.logoFile) {
        formData.append('logoFile', this.logoFile);
      }
      
      // Send the request
      await firstValueFrom(this.projectService.createProject(formData));
      
      this.toastr.success('Project created successfully');
      this.resetForm();
      this.router.navigate(['/dashboard/project']);
    } catch (error) {
      console.error('Error creating project:', error);
      this.toastr.error('Failed to create project. Please try again.');
    } finally {
      this.isLoading = false;
    }
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
    this.selectedTechnology = null;
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
    // Check file type
    if (!file.type.match(/image\/(jpeg|jpg|png|svg\+xml)/)) {
      this.toastr.error('Invalid file type. Please upload JPG, PNG, or SVG.');
      return;
    }
    
    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      this.toastr.error('File too large. Maximum size is 2MB.');
      return;
    }
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreview = e.target.result;
      this.logoFile = file;
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
    const target = event.target as HTMLElement;
    target.classList.add('border-blue-500');
    target.classList.add('bg-blue-50/30');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    target.classList.remove('border-blue-500');
    target.classList.remove('bg-blue-50/30');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    target.classList.remove('border-blue-500');
    target.classList.remove('bg-blue-50/30');
    
    if (event.dataTransfer && event.dataTransfer.files.length) {
      const file = event.dataTransfer.files[0];
      this.validateAndPreviewLogo(file);
    }
  }

  ngOnDestroy() {
    if (this.tagSubscription) {
      this.tagSubscription.unsubscribe();
    }
  }

  onTagInput(event: any) {
    this.tagInputSubject.next(event.target.value);
  }

  private async checkTagAndSuggest(tag: string) {
    if (tag.trim() === '') {
      this.isTagAvailable = null;
      this.tagSuggestions = [];
      return;
    }
  
    this.isCheckingTag = true;
    
    try {
      const exists = await firstValueFrom(
        this.projectService.checkPrimaryTagExists(tag)
      );
      
      this.isTagAvailable = !exists;
      
      if (exists) {
        // If tag is taken, generate and check for alternative suggestions
        const baseSuggestions = this.generateTagSuggestions(tag);
        
        // Find multiple available tags
        const availableTags = await this.findMultipleAvailableTags(baseSuggestions);
        
        this.tagSuggestions = availableTags;
      } else {
        // If tag is available, clear suggestions
        this.tagSuggestions = [];
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
    const maxAvailableTags = 3; // Limit to 3 suggestions
    
    for (const tag of suggestions) {
      if (availableTags.length >= maxAvailableTags) {
        break;
      }
      
      try {
        const exists = await firstValueFrom(
          this.projectService.checkPrimaryTagExists(tag)
        );
        
        if (!exists) {
          availableTags.push(tag);
        }
      } catch (error) {
        console.error('Error checking tag suggestion:', error);
      }
    }
    
    return availableTags;
  }
  
  getTagStatusClasses(): { [key: string]: boolean } {
    if (this.isCheckingTag) {
      return {
        'border-blue-300': true,
        'ring-1': true,
        'ring-blue-300': true,
      };
    }
    
    if (this.isTagAvailable === true) {
      return {
        'border-green-500': true,
        'ring-1': true,
        'ring-green-500': true,
      };
    }
    
    if (this.isTagAvailable === false) {
      return {
        'border-red-500': true,
        'ring-1': true,
        'ring-red-500': true,
      };
    }
    
    return {};
  }
} 