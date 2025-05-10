import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProjectService, ProjectType } from '../../../services/project.service';
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
  heroXCircle,
  heroArrowRight,
  heroArrowLeft,
  heroCheck,
  heroServerStack,
  heroSquare3Stack3d
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
    heroXCircle,
    heroArrowRight,
    heroArrowLeft,
    heroCheck,
    heroServerStack,
    heroSquare3Stack3d
  })]
})
export class AddProjectComponent implements OnInit, OnDestroy {
  // Stepper control
  currentStep: number = 1;
  selectedArchitecture: 'monolithic' | 'microservice' | null = null;
  
  // Helper getter for template comparisons
  get currentStepValue(): string {
    return this.currentStep.toString();
  }
  
  // Architecture type enum
  ProjectType = ProjectType;
  
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

  // Add a property to track the created package ID
  packageId: number | null = null;
  createdMicroservices: any[] = [];

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
    this.currentUser = this.authService.getCurrentUser();
    
    // Check for query parameters
    this.router.routerState.root.queryParams.subscribe(params => {
      // Check for package creation mode
      if (params['mode'] === 'microservice' && params['packageId']) {
        // We're adding a microservice to an existing package
        this.packageId = Number(params['packageId']);
        this.selectedArchitecture = 'microservice';
        
        // Fetch the package details
        this.isLoading = true;
        this.projectService.getProjectById(this.packageId).subscribe({
          next: (packageData) => {
            // Populate the package form
            this.package = {
              name: packageData.name,
              description: packageData.description,
              repositoryLink: packageData.repositoryLink,
              deadlineDate: packageData.deadlineDate || new Date().toISOString().split('T')[0],
            };
            
            // If step parameter is provided, go to that step
            if (params['step']) {
              const stepNumber = Number(params['step']);
              if (!isNaN(stepNumber) && stepNumber > 0 && stepNumber <= 3) {
                this.currentStep = stepNumber;
              }
            }
            
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error fetching package details:', error);
            this.toastr.error('Failed to load package details. Please try again.');
            this.isLoading = false;
            // Navigate back to the project dashboard
            this.router.navigate(['/dashboard/project']);
          }
        });
      }
    });
  }
  
  // Architecture selection
  selectArchitecture(architecture: 'monolithic' | 'microservice') {
    this.selectedArchitecture = architecture;
    
    // Reset both forms when changing architecture
    if (architecture === 'monolithic') {
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
    } else if (architecture === 'microservice') {
      this.package = {
        name: '',
        description: '',
        repositoryLink: '',
        deadlineDate: new Date().toISOString().split('T')[0],
      };
      this.microservices = [];
    }
    
    // Reset technology and logo
    this.selectedTechnology = null;
    this.logoPreview = null;
    this.logoFile = null;
  }
  
  // Microservice functions
  async addMicroservice() {
    // Validate the current microservice
    if (this.validateMicroservice()) {
      this.isLoading = true;
      
      try {
        // Verify we have a package ID
        if (!this.packageId) {
          this.toastr.error('Package ID is missing. Please create a package first.');
          this.isLoading = false;
          return;
        }
        
        // Create the microservice and associate it with the package
        const msFormData = new FormData();
        msFormData.append('name', this.currentMicroservice.name.trim());
        msFormData.append('description', this.currentMicroservice.description.trim());
        msFormData.append('repositoryLink', this.package.repositoryLink?.trim() || ''); 
        msFormData.append('primaryTag', this.currentMicroservice.projectTag.trim());
        msFormData.append('deadlineDate', this.package.deadlineDate || new Date().toISOString().split('T')[0]);
        msFormData.append('progressPercentage', '0');
        msFormData.append('status', 'Active');
        msFormData.append('priority', 'Medium');
        
        // Explicitly set the project type and parent project ID
        msFormData.append('projectType', ProjectType.MICROSERVICES);
        msFormData.append('parentProject.id', this.packageId.toString());
        
        // Log this for debugging
        console.log('Using package ID for microservice:', this.packageId);
        
        // Add creator information if available
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData && userData.id) {
            msFormData.append('creatorId', userData.id.toString());
          }
        }
        
        // Add technologies
        if (this.currentMicroservice.technologies && this.currentMicroservice.technologies.length > 0) {
          // As a comma-separated string
          msFormData.append('technologies', this.currentMicroservice.technologies.join(', '));
          
          // As an array with indexed naming
          this.currentMicroservice.technologies.forEach((technology: string, index: number) => {
            msFormData.append(`technologiesArray[${index}]`, technology);
          });
        }
        
        try {
          // Create the microservice
          const createdMicroservice = await firstValueFrom(
            this.projectService.createMicroservice(msFormData, this.packageId)
          );
          
          // Add to our displayed list
          this.microservices.push({...this.currentMicroservice});
          this.createdMicroservices.push(createdMicroservice);
          
          // Reset form for next microservice
          this.currentMicroservice = {
            name: '',
            description: '',
            technologies: [],
            projectTag: ''
          };
          this.selectedTechnology = null;
          
          this.toastr.success('Microservice added successfully');
        } catch (error: any) {
          console.error('Error creating microservice:', error);
          this.projectService.handleMicroserviceError(error, this.packageId);
          if (error.status === 403) {
            this.toastr.error('You do not have permission to create microservices');
          } else if (error.message) {
            this.toastr.error(error.message);
          } else {
            this.toastr.error('Failed to create microservice');
          }
        }
      } catch (error: any) {
        console.error('Error in addMicroservice process:', error);
        if (error.status === 403) {
          this.toastr.error('You do not have permission to create microservices');
        } else if (error.message) {
          this.toastr.error(error.message);
        } else {
          this.toastr.error('Failed to create microservice');
        }
      } finally {
        this.isLoading = false;
      }
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
    if (this.microservices.length === 0) {
      this.toastr.error('At least one microservice is required');
      return;
    }
    
    // If we've already created microservices, just navigate to the project page
    if (this.packageId && this.createdMicroservices.length > 0) {
      this.toastr.success(`Package completed with ${this.microservices.length} microservices`);
      this.router.navigate(['/dashboard/project']);
      return;
    }
    
    // This path should rarely be taken now since we create the package when moving to step 3
    this.isLoading = true;
    
    try {
      // If the package hasn't been created yet (failsafe)
      if (!this.packageId) {
        // Create the package first (similar to nextStep)
        const packageFormData = new FormData();
        packageFormData.append('name', this.package.name?.trim() || '');
        packageFormData.append('description', this.package.description?.trim() || '');
        packageFormData.append('repositoryLink', this.package.repositoryLink?.trim() || '');
        packageFormData.append('primaryTag', (this.package.name?.toLowerCase().replace(/\s+/g, '-') || 'default') + '-package');
        packageFormData.append('deadlineDate', this.package.deadlineDate || new Date().toISOString().split('T')[0]);
        packageFormData.append('progressPercentage', '0');
        packageFormData.append('status', 'Active');
        packageFormData.append('priority', 'Medium');
        
        // Add creator information 
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData && userData.id) {
            packageFormData.append('creatorId', userData.id.toString());
          }
        }
        
        // Add logo if exists
        if (this.logoFile) {
          packageFormData.append('logo', this.logoFile, this.logoFile.name);
        }
        
        // Create the package
        this.projectService.createProject(packageFormData).subscribe({
          next: (response) => {
            // Store the package ID for use when creating microservices
            if (response && response.id !== undefined && response.id !== null) {
              this.packageId = Number(response.id);
              this.toastr.success('Package created successfully');
              this.currentStep = 3;
            } else {
              this.toastr.error('Failed to get package ID from response');
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error creating package:', error);
            if (error.status === 403) {
              this.toastr.error('You do not have permission to create projects');
            } else if (error.message) {
              this.toastr.error(error.message);
            } else {
              this.toastr.error('Failed to create package');
            }
            this.isLoading = false;
          }
        });
      }
      
      // Create any remaining microservices that haven't been added yet
      const pendingMicroservices = this.microservices.filter((_, index) => !this.createdMicroservices[index]);
      
      for (const ms of pendingMicroservices) {
        const msFormData = new FormData();
        msFormData.append('name', ms.name.trim());
        msFormData.append('description', ms.description.trim());
        msFormData.append('repositoryLink', this.package.repositoryLink?.trim() || '');
        msFormData.append('primaryTag', ms.projectTag.trim());
        msFormData.append('deadlineDate', this.package.deadlineDate || new Date().toISOString().split('T')[0]);
        msFormData.append('progressPercentage', '0');
        msFormData.append('status', 'Active');
        msFormData.append('priority', 'Medium');
        
        // Add technologies
        if (ms.technologies && ms.technologies.length > 0) {
          msFormData.append('technologies', ms.technologies.join(', '));
          ms.technologies.forEach((tech: string, index: number) => {
            msFormData.append(`technologiesArray[${index}]`, tech);
          });
        }
        
        // Create the microservice using the stored package ID
        if (this.packageId) {
          await firstValueFrom(
            this.projectService.createMicroservice(msFormData, this.packageId)
          );
        } else {
          throw new Error('Package ID is undefined');
        }
      }
      
      this.toastr.success(`Microservice package completed with ${this.microservices.length} microservices`);
      this.router.navigate(['/dashboard/project']);
    } catch (error) {
      console.error('Error creating microservice package:', error);
      this.toastr.error('Failed to complete the microservice package');
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
    formData.append('progressPercentage', this.project.progressPercentage?.toString() || '0');
    formData.append('status', this.project.status || 'Active');
    formData.append('priority', this.project.priority || 'Medium');
    
    // Explicitly set the project type to MONOLITHIC
    formData.append('projectType', ProjectType.MONOLITHIC);
    
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

      console.log('Checking primary tag (unique identifier):', tag.trim());
      
      const primaryTagExists = await firstValueFrom(
        this.projectService.checkPrimaryTagExists(tag.trim())
      );
      
      console.log('Primary tag exists in database?', primaryTagExists);
      
      // primaryTagExists: true means the identifier is taken, false means it's available
      this.isTagAvailable = !primaryTagExists;
      
      if (primaryTagExists) {
        console.log('Primary tag is taken, generating alternative identifiers...');
        const suggestions = this.generateTagSuggestions(tag.trim());
        console.log('Generated alternative identifiers:', suggestions);
        const availableTags = await this.findMultipleAvailableTags(suggestions);
        console.log('Verified available identifiers:', availableTags);
        this.tagSuggestions = availableTags;
        
        this.toastr.warning('This project identifier is already taken. Please choose from the suggestions or try a different one.');
      } else {
        console.log('Primary tag is available!');
        this.tagSuggestions = []; // Clear suggestions if tag is valid
        this.toastr.success('This project identifier is available!');
      }
    } catch (error: any) {
      console.error('Error checking primary tag:', error);
      this.isTagAvailable = null;
      
      if (error.status === 403) {
        this.toastr.error('Please log in again to check identifier availability');
        this.router.navigate(['/login']);
      } else if (error.status === 401) {
        this.toastr.error('Your session has expired. Please log in again.');
        this.router.navigate(['/login']);
      } else {
        this.toastr.error('Failed to check identifier availability. Please try again.');
      }
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

  // Stepper navigation functions
  nextStep() {
    // When we're adding a microservice to an existing package and step is less than 3,
    // skip to step 3 directly
    if (this.packageId && this.currentStep < 3) {
      this.currentStep = 3;
      return;
    }

    // Normal flow for new package creation
    if (this.currentStep === 1) {
      if (!this.selectedArchitecture) {
        this.toastr.error('Please select a project architecture type');
        return;
      }
      
      this.currentStep = 2;
    }
    else if (this.currentStep === 2) {
      // If we're creating a microservice package
      if (this.selectedArchitecture === 'microservice') {
        // Validate package information
        if (!this.package.name?.trim()) {
          this.toastr.error('Package name is required');
          return;
        }
        if (!this.package.description?.trim()) {
          this.toastr.error('Package description is required');
          return;
        }
        if (!this.package.repositoryLink?.trim()) {
          this.toastr.error('Repository link is required');
          return;
        }
        if (!this.package.deadlineDate) {
          this.toastr.error('Deadline date is required');
          return;
        }
        
        // Create the package if it doesn't exist already
        if (!this.packageId) {
          this.isLoading = true;
          
          const packageFormData = new FormData();
          packageFormData.append('name', this.package.name.trim());
          packageFormData.append('description', this.package.description.trim());
          packageFormData.append('repositoryLink', this.package.repositoryLink.trim());
          packageFormData.append('primaryTag', this.package.name.toLowerCase().replace(/\s+/g, '-') + '-package');
          packageFormData.append('deadlineDate', this.package.deadlineDate);
          packageFormData.append('progressPercentage', '0');
          packageFormData.append('status', 'Active');
          packageFormData.append('priority', 'Medium');
          
          // Explicitly set the project type to MICROSERVICES_PACKAGE
          packageFormData.append('projectType', ProjectType.MICROSERVICES_PACKAGE);
          
          // Add creator information
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData && userData.id) {
              packageFormData.append('creatorId', userData.id.toString());
            }
          }
          
          // Add the logo if one was selected
          if (this.logoFile) {
            packageFormData.append('logo', this.logoFile);
          }
          
          // Create the package
          this.projectService.createProject(packageFormData).subscribe({
            next: (response) => {
              // Store the package ID for use when creating microservices
              if (response && response.id !== undefined && response.id !== null) {
                this.packageId = Number(response.id);
                this.toastr.success('Package created successfully');
                this.currentStep = 3;
              } else {
                this.toastr.error('Failed to get package ID from response');
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error creating package:', error);
              if (error.status === 403) {
                this.toastr.error('You do not have permission to create projects');
              } else if (error.message) {
                this.toastr.error(error.message);
              } else {
                this.toastr.error('Failed to create package');
              }
              this.isLoading = false;
            }
          });
        } else {
          // Package already exists, just move to the next step
          this.currentStep = 3;
        }
      } 
      // For monolithic projects
      else if (this.validateProject()) {
        this.currentStep = 3;
      }
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
  
  // Remove a microservice from the list
  removeMicroservice(index: number) {
    if (this.createdMicroservices[index] && this.createdMicroservices[index].id) {
      // If this microservice was already created, delete it from the backend
      this.isLoading = true;
      this.projectService.deleteProject(this.createdMicroservices[index].id).subscribe({
        next: () => {
          this.microservices.splice(index, 1);
          this.createdMicroservices.splice(index, 1);
          this.toastr.info('Microservice removed');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error removing microservice:', error);
          this.toastr.error('Failed to remove microservice');
          this.isLoading = false;
        }
      });
    } else {
      // If it's only in the local array and wasn't created yet
      this.microservices.splice(index, 1);
      if (this.createdMicroservices[index]) {
        this.createdMicroservices.splice(index, 1);
      }
      this.toastr.info('Microservice removed');
    }
  }
  
  // Update canProceed to handle the packageId case
  canProceed(): boolean {
    // When adding a microservice to an existing package, skip validation for steps 1-2
    if (this.packageId && this.currentStep < 3) {
      return true;
    }

    // Regular validation
    if (this.currentStep === 1) {
      return !!this.selectedArchitecture;
    }
    else if (this.currentStep === 2) {
      if (this.selectedArchitecture === 'microservice') {
        return !!(this.package.name?.trim() && 
                this.package.description?.trim() && 
                this.package.repositoryLink?.trim() && 
                this.package.deadlineDate);
      } else {
        return this.validateProject();
      }
    }
    
    return true;
  }
}