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
  imports: [CommonModule, FormsModule],
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
  private originalData: ProfileData = { ...this.profileData };
  private selectedImageFile: File | null = null;

  constructor(private dialog: MatDialog, private userService: UserService) {
    this.generateContributionData();
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const storedUser = localStorage.getItem('user');
    const userEmail = storedUser ? JSON.parse(storedUser).email : '';

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

    // Validate required fields
    if (!this.profileData.firstname || !this.profileData.lastname || !this.profileData.email) {
      this.errorMessage = 'First name, last name and email are required';
      this.isLoading = false;
      return;
    }

    const profileRequest: ProfileRequest = {
      firstname: this.profileData.firstname.trim(),
      lastname: this.profileData.lastname.trim(),
      email: this.profileData.email.trim(),
      role: this.profileData.role || '',
      image: this.selectedImageFile,
      bio: this.profileData.bio?.trim() || '',
      phone: this.profileData.phone?.trim() || '',
      location: this.profileData.location?.trim() || '',
      company: this.profileData.company?.trim() || '',
      pronouns: this.profileData.pronouns || '',
      lien: this.profileData.github || '', // Map github to lien
    };

    console.log('Sending profile update:', profileRequest);

    this.userService.updateUserProfile(this.profileData.email, profileRequest)
      .subscribe({
        next: (response: ProfileResponse) => {
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
        },
        error: (error) => {
          console.error('Profile update error:', error);
          this.errorMessage = error.message || 'Failed to update profile. Please try again.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Please select a valid image file';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.errorMessage = 'Image size should be less than 5MB';
        return;
      }

      this.selectedImageFile = file;
      this.errorMessage = ''; // Clear any previous error

      // Preview the image
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
    if (count <= 2) return 'bg-purple-200 dark:bg-purple-900';
    if (count <= 5) return 'bg-purple-300 dark:bg-purple-700';
    if (count <= 8) return 'bg-purple-400 dark:bg-purple-500';
    return 'bg-purple-500 dark:bg-purple-300';
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
}
