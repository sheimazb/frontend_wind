import { Component, OnInit } from '@angular/core';
import { UserService, ProfileResponse, ProfileRequest } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogSettingsProfielComponent } from '../../components/dialog/dialog-settings-profiel/dialog-settings-profiel.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

interface ProfileData {
  firstname: string;
  lastname: string;
  role: string;
  pronouns: string;
  bio: string;
  location: string;
  github: string;
  company: string;
  phone: string;
  email: string;
  image: string;
}

interface ContributionDay {
  date: string;
  count: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  imports: [
    CommonModule,
    FormsModule
  ],
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  isEditing = false;
  isLoading = false;
  showSuccess = false;
  errorMessage = '';
  profileImage = '';

  profileData: ProfileData = {
    firstname: '',
    lastname: '',
    role: '',
    pronouns: '',
    bio: '',
    location: '',
    github: '',
    company: '',
    phone: '',
    email: '',
    image: '',
  };

  weeks: ContributionDay[][] = [];
  private originalData: ProfileData;
  private selectedImageFile: File | null = null;

  constructor(private dialog: MatDialog, private userService: UserService) {
    this.originalData = { ...this.profileData };
    this.generateContributionData();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  // Load user profile from the backend with error handling
  loadUserProfile(): void {
    this.isLoading = true;
  
    const storedUser = localStorage.getItem('user'); // Ensure this is the correct key
  const userEmail = storedUser ? JSON.parse(storedUser).email : '';
  
    if (!userEmail) {
      console.error('No user email found in localStorage.');
      this.errorMessage = 'User email not found. Please log in again.';
      this.isLoading = false;
      return;
    }
  
    this.userService.getUserProfile(userEmail)
      .pipe(
        catchError(error => {
          console.error('Error in getUserProfile:', error);
          this.errorMessage = 'Failed to load user profile. Using default profile data.';
  
          return of({
            id: 0,
            firstname: 'Default',
            lastname: 'User',
            role: '',
            email: userEmail,
            image: '',
            bio: 'This is a default profile as we could not load your data.',
            phone: '',
            location: '',
            company: '',
            pronouns: '',
            lien: ''
          } as ProfileResponse);
        })
      )
      .subscribe({
        next: (response: ProfileResponse) => {
          this.profileData = {
            firstname: response.firstname,
            lastname: response.lastname,
            role: response.role,
            pronouns: response.pronouns || '',
            bio: response.bio || '',
            location: response.location || '',
            github: '',
            company: response.company || '',
            phone: response.phone || '',
            email: response.email || userEmail,
            image: response.image || '',
          };
          this.profileImage = response.image || this.profileImage;
          this.originalData = { ...this.profileData };
        },
        error: (error) => {
          this.errorMessage = 'Failed to load user profile. Please try again later.';
          console.error('Failed to load user profile:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }
  

  // Toggle edit mode
  toggleEdit(): void {
    if (this.isEditing) {
      this.saveProfile();
    } else {
      this.isEditing = true;
    }
  }

 // Save profile changes
saveProfile(): void {
  this.isLoading = true;
  this.errorMessage = ''; // Clear previous errors
  const userEmail = this.profileData.email;
  
  const profileRequest: ProfileRequest = {
    firstname: this.profileData.firstname,
    lastname: this.profileData.lastname,
    email: this.profileData.email,
    role: this.profileData.role,
    image: this.selectedImageFile,
    bio: this.profileData.bio || '',
    phone: this.profileData.phone || '',
    location: this.profileData.location || '',
    company: this.profileData.company || '',
    pronouns: this.profileData.pronouns || '',
    lien: '',
  };

  console.log('Submitting profile update:', profileRequest);

  this.userService.updateUserProfile(userEmail, profileRequest).subscribe({
    next: (response: ProfileResponse) => {
      console.log('Profile updated successfully:', response);
      this.profileData = {
        ...this.profileData,
        firstname: response.firstname,
        lastname: response.lastname,
        pronouns: response.pronouns || '',
        bio: response.bio || '',
        location: response.location || '',
        role: response.role || '',
        company: response.company || '',
        phone: response.phone || '',
        email: response.email,
        image: response.image || '',
      };
      this.profileImage = response.image || this.profileImage;
      this.isEditing = false;
      this.selectedImageFile = null;
      this.showSuccess = true;
      setTimeout(() => (this.showSuccess = false), 3000);
      this.originalData = { ...this.profileData }; // Update original data
    },
    error: (error) => {
      console.error('Profile update error full details:', error);
      
      if (error.status === 401 || error.status === 403) {
        this.errorMessage = 'Authentication error. Please log in again.';
      } else if (error.status === 500) {
        this.errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.error && typeof error.error === 'string') {
        this.errorMessage = error.error;
      } else {
        this.errorMessage = 'Failed to update profile. Please try again.';
      }
    },
    complete: () => {
      this.isLoading = false;
    }
  });
}

  // Cancel editing and revert changes
  cancelEdit(): void {
    this.profileData = { ...this.originalData };
    this.isEditing = false;
    this.selectedImageFile = null;
  }

  // Handle image file selection
  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
  
    if (file) {
      this.selectedImageFile = file; // Store the file if needed
  
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const imageUrl = e.target?.result as string;
        
        if (imageUrl) {
          this.profileImage = imageUrl; // Update image source
        }
      };
  
      reader.readAsDataURL(file); // Convert file to data URL
    }
  }
  

  // Generate contribution data
  private generateContributionData(): void {
    const today = new Date();
    const weeks: ContributionDay[][] = [];
    
    for (let week = 0; week < 52; week++) {
      const weekData: ContributionDay[] = [];
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (week * 7 + day));
        
        weekData.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 12)
        });
      }
      
      weeks.push(weekData);
    }
    
    this.weeks = weeks.reverse();
  }

  // Open dialog
  openDialog(): void {
    const dialogRef = this.dialog.open(DialogSettingsProfielComponent, {
      width: '1050px',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: this.profileData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog closed with result:', result);
      }
    });
  }

  // Get contribution color
  getContributionColor(count: number): string {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 2) return 'bg-purple-200 dark:bg-purple-900';
    if (count <= 5) return 'bg-purple-300 dark:bg-purple-700';
    if (count <= 8) return 'bg-purple-400 dark:bg-purple-500';
    return 'bg-purple-500 dark:bg-purple-300';
  }
}