import { Component, OnInit } from '@angular/core';
import { UserService, ProfileResponse, ProfileRequest } from '../../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogSettingsProfielComponent } from '../../components/dialog/dialog-settings-profiel/dialog-settings-profiel.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { StatsService, StatsResponse } from '../../services/stats.service';
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
  imports: [CommonModule, FormsModule],
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  isEditing = false;
  isLoading = false;
  showSuccess = false;
  errorMessage = '';
  phoneError = false;
  profileImage = '';
  currentMonth = 'Jan';
  currentYear = new Date().getFullYear();
  totalContributions = 0;
  defaultProfileImage = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

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
  private originalData: ProfileData = { ...this.profileData };
  private selectedImageFile: File | null = null;
  partnerStats: StatsResponse = {
    totalPartners: 0,
    activePartners: 0,
    lockedPartners: 0
  };
  
  constructor(private dialog: MatDialog, private userService: UserService, private partnerService: StatsService) {
    this.generateContributionData();
    this.calculateTotalContributions();
  }


  ngOnInit(): void {
    this.loadUserProfile();
    this.loadPartnerStatistics();
    console.log(this.partnerStats);
  }
  loadPartnerStatistics(): void {
    this.isLoading = true;
    
    this.partnerService.getPartnerStats().subscribe({
      next: (response: StatsResponse) => {
        this.partnerStats = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load partner statistics', error);
        this.isLoading = false;
        // You might want to add error handling here
      }
    });
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const storedUser = localStorage.getItem('user');
    const userEmail = storedUser ? JSON.parse(storedUser).email : '';

    // Set default profile image initially
    this.profileImage = this.defaultProfileImage;

    if (!userEmail) {
      this.errorMessage = 'User email not found. Please log in again.';
      this.isLoading = false;
      return;
    }

    this.userService.getUserProfile(userEmail)
      .pipe(
        catchError((error) => {
          console.error('Error fetching user profile:', error);
          this.errorMessage = 'Failed to load user profile. Using default data.';
          return of({
            firstname: 'Default',
            lastname: 'User',
            role: '',
            email: userEmail,
            image: '',
            bio: 'Default profile as we could not load your data.',
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
          this.profileImage = response.image || '';
          this.originalData = { ...this.profileData };
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  isAdmin(): boolean {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return false;
    }
    const userData = JSON.parse(storedUser);
    return userData.role === 'ADMIN';
  }
  isPartner(): boolean {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return false;
    }
    const userData = JSON.parse(storedUser);
    return userData.role === 'PARTNER';
  }

  isManager(): boolean {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return false;
    }
    const userData = JSON.parse(storedUser);
    return userData.role === 'MANAGER'; 
  }
  isDeveloper(): boolean {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return false;
    }
    const userData = JSON.parse(storedUser);  
    return userData.role === 'DEVELOPER';
  }
  isTester(): boolean {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return false;
    }
    const userData = JSON.parse(storedUser);
    return userData.role === 'TESTER';
  }
  
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.profileData = { ...this.originalData };
      this.selectedImageFile = null;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileData = { ...this.originalData };
    this.selectedImageFile = null;
    this.profileImage = this.originalData.image;
  }

  saveProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    if (!this.profileData.firstname || !this.profileData.lastname || !this.profileData.email) {
      this.errorMessage = 'First name, last name and email are required';
      this.isLoading = false;
      return;
    }
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      this.errorMessage = 'User session not found. Please log in again.';
      this.isLoading = false;
      return;
    }
    const userData = JSON.parse(storedUser);
    if (!userData.role) {
      this.errorMessage = 'User role not found. Please log in again.';
      this.isLoading = false;
      return;
    }

    console.log('Current user data:', userData);
    console.log('Updating profile with role:', userData.role);

    const profileRequest: ProfileRequest = {
      firstname: this.profileData.firstname.trim(),
      lastname: this.profileData.lastname.trim(),
      email: this.profileData.email.trim(),
      role: userData.role || '', 
      image: this.selectedImageFile,
      bio: this.profileData.bio?.trim() || '',
      phone: this.profileData.phone?.trim() || '',
      location: this.profileData.location?.trim() || '',
      company: this.profileData.company?.trim() || '',
      pronouns: this.profileData.pronouns || '',
      lien: this.profileData.github || '', 
    };

    console.log('Sending profile update:', profileRequest);

    this.userService.updateUserProfile(this.profileData.email, profileRequest)
      .subscribe({
        next: (response: ProfileResponse) => {
          this.handleSuccessfulUpdate(response);
        },
        error: (error) => {
          console.error('Profile update error:', error);
          
          if (error.status === 403 || error.status === 415) {
            // Try fallback method without image
            console.log('Trying fallback method without image upload...');
            this.tryFallbackUpdate(profileRequest);
          } else if (error.status === 401) {
            this.errorMessage = 'Your session has expired. Please log in again.';
            this.isLoading = false;
          } else {
            this.errorMessage = error.message || 'Failed to update profile. Please try again.';
            this.isLoading = false;
          }
        }
      });
  }

  private tryFallbackUpdate(profileRequest: ProfileRequest): void {
 
    const basicRequest = { ...profileRequest };
    delete (basicRequest as any).image;

    this.userService.updateUserProfileBasic(this.profileData.email, basicRequest)
      .subscribe({
        next: (response: ProfileResponse) => {
          this.handleSuccessfulUpdate(response);
        },
        error: (error) => {
          console.error('Fallback profile update error:', error);
          
          if (error.status === 403) {
            let detailedError = 'You do not have permission to update your profile.';
            if (error.error && typeof error.error === 'object') {
              detailedError += ' Details: ' + JSON.stringify(error.error);
            }
            this.errorMessage = detailedError;
          } else if (error.status === 401) {
            this.errorMessage = 'Your session has expired. Please log in again.';
          } else {
            this.errorMessage = error.message || 'Failed to update profile. Please try again.';
          }
          
          this.isLoading = false;
        }
      });
  }

  private handleSuccessfulUpdate(response: ProfileResponse): void {
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
    this.profileImage = response.image || '';
    
    this.isEditing = false;
    this.selectedImageFile = null;
    this.showSuccess = true;
    setTimeout(() => (this.showSuccess = false), 3000);
    this.originalData = { ...this.profileData };
    this.isLoading = false;
    
    console.log('Profile successfully updated and shared via UserService');
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {

      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select a valid image file';
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.errorMessage = 'Image size should be less than 5MB';
        return;
      }

      this.selectedImageFile = file;
      this.errorMessage = '';

      
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          this.profileImage = imageUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogSettingsProfielComponent, {
      width: '1050px',
      height: 'auto',
      panelClass: 'custom-dialog-container',
      data: this.profileData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Dialog closed with result:', result);
      }
    });
  }

  getContributionColor(count: number): string {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count <= 2) return 'bg-blue-200 dark:bg-blue-900';
    if (count <= 5) return 'bg-blue-300 dark:bg-blue-700';
    if (count <= 8) return 'bg-blue-400 dark:bg-blue-500';
    return 'bg-blue-500 dark:bg-blue-300';
  }

  selectMonth(month: string): void {
    this.currentMonth = month;
  
  }

  private calculateTotalContributions(): void {
    this.totalContributions = this.weeks.reduce((total, week) => {
      return total + week.reduce((weekTotal, day) => weekTotal + day.count, 0);
    }, 0);
  }

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
          count: Math.floor(Math.random() * 12),
        });
      }
      weeks.push(weekData);
    }

    this.weeks = weeks.reverse();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.defaultProfileImage;
    }
  }

  validatePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.phoneError = !/^\d*$/.test(value);
    if (this.phoneError) {
      input.value = value.replace(/[^\d]/g, '');
    }
  }
}
