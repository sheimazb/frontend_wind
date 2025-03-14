import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ProfileResponse, UserService } from '../../services/user.service';
import { catchError, of } from 'rxjs';
interface ProfileData {
  image: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})

export class NavbarComponent implements OnInit {
  userRole: string | null = null;
  darkMode = false;
  dropdownOpen = false;
  currentUser: { email: string; fullName: string; role: string } | null = null;
  showSearchForm: boolean = false;
  isLargeScreen: boolean = false;
  private originalData: ProfileData;

  // User information
  userName: string = 'John Doe';
  userEmail: string = 'john@example.com';
  userImage: string = 'assets/images/users/default-avatar.png';
  
  // Dropdown states
  showNotifications: boolean = false;
  showProfileMenu: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    private userService: UserService,
  ) {
    this.originalData = { ...this.profileData };
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;
    this.loadUserProfile();

    // Check if dark mode was previously enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
      this.darkMode = true;
      document.documentElement.classList.add('dark');
    }

    // Get current user data
    this.currentUser = this.authService.getCurrentUser();

    // Check if screen is large
    this.isLargeScreen = window.innerWidth >= 1024; // 1024px is the lg breakpoint in Tailwind
    
    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.isLargeScreen = window.innerWidth >= 1024;
    });
  
  }

  isLoading=false;
  profileImage = '';
  errorMessage = '';

  profileData: ProfileData = {
    image: '',
  };
  get isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  loadUserProfile(): void {
    this.isLoading = true;
    const storedUser = localStorage.getItem('user'); 
    const userEmail = storedUser ? JSON.parse(storedUser).email : '';
  this.userService.getUserProfile(userEmail)
      .pipe(
        catchError(error => {
          console.error('Error in getUserProfile:', error);
          this.errorMessage = 'Failed to load user profile. Using default profile data.';
          
          // Return a default response to continue the app flow
          return of({
            image: '',
          } as ProfileResponse);
        })
      ).subscribe({
        next:(response: ProfileResponse)=>{
          this.profileData = {
            image: response.image || '',
          };
          this.profileImage = response.image || this.profileImage;
          this.originalData = { ...this.profileData };
          console.log('test',response)
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

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout() {
    // Show loading indicator if needed
    this.isLoading = true;
    
    // Call the auth service logout method
    this.authService.logout();
    
    // Navigate to login page after a short delay to ensure the API call has time to start
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/login']);
    }, 300);
  }

  toggleSearchForm() {
    this.showSearchForm = !this.showSearchForm;
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  // Toggle methods
  toggleNotificationsMenu(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false; // Close profile menu when opening notifications
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false; // Close notifications when opening profile menu
  }
}
