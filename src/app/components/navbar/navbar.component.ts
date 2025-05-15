import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ProfileResponse, UserService } from '../../services/user.service';
import { catchError, of, Subscription } from 'rxjs';
import { NotificationService, NotificationItem } from '../../services/notification.service';
import { WebsocketService } from '../../services/websocket.service';
import { environment } from '../../../environments/environment';

// Define interfaces for types
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

export class NavbarComponent implements OnInit, OnDestroy {
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
  defaultProfileImage: string = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  userImage: string = this.defaultProfileImage;
  
  // Dropdown states
  showNotifications: boolean = false;
  showProfileMenu: boolean = false;

  // Notifications data
  notifications: NotificationItem[] = [];
  private notificationSubscription: Subscription | undefined;
  private unreadCountSubscription: Subscription | undefined;
  private profileSubscription: Subscription | undefined;
  unreadNotificationsCount: number = 0;
  isLoadingNotifications: boolean = false;

  // Add this property to your NavbarComponent class
  websocketConnected: boolean = false;
  
  // Make sure to add the subscription to the class
  private subscription = new Subscription();

  // Add environment variable to make it available in the template
  environment = environment;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    private userService: UserService,
    private notificationService: NotificationService,
    private websocketService: WebsocketService
  ) {
    this.originalData = { image: '' };
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;
    this.loadUserProfile();
    
    // Subscribe to profile changes
    this.profileSubscription = this.userService.profileChanges.subscribe(profile => {
      if (profile && profile.email === this.currentUser?.email) {
        this.profileData = {
          image: profile.image || '',
        };
        this.profileImage = profile.image || this.profileImage;
        this.originalData = { ...this.profileData };
        console.log('Profile updated from service:', profile);
      }
    });
    
    // Connect to notification service if user is logged in
    if (currentUser?.email) {
      this.userEmail = currentUser.email;
      
      // Initialize the notification service with current user info
      this.notificationService.currentUserEmail = currentUser.email;
      
      // Get tenant info from localStorage if available
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData && userData.tenant) {
            this.notificationService.currentUserTenant = userData.tenant;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Setup WebSocket connection for notifications
      this.setupNotifications();
      
      // Subscribe to notifications
      this.notificationSubscription = this.notificationService.getNotifications()
        .subscribe(notifications => {
          console.log('Received notifications update:', notifications.length);
          this.notifications = notifications;
        });

      // Subscribe to unread count
      this.unreadCountSubscription = this.notificationService.getUnreadCount()
        .subscribe(count => {
          console.log('Received unread count update:', count);
          this.unreadNotificationsCount = count;
        });
        
      // Ensure notifications are loaded even if WebSocket doesn't connect
      setTimeout(() => {
        if (this.notifications.length === 0 && !this.isLoadingNotifications) {
          console.log('No notifications loaded after delay, initializing directly');
          this.notificationService.initializeNotifications();
        }
      }, 2000);
    }

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

  ngOnDestroy() {
    // Clean up subscriptions when the component is destroyed
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.unreadCountSubscription) {
      this.unreadCountSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    // Disconnect from the notification service
    this.websocketService.disconnect();
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
    
    // Check if we already have the profile in the service
    const currentProfile = this.userService.getCurrentProfileValue();
    if (currentProfile && currentProfile.email === userEmail) {
      this.profileData = {
        image: currentProfile.image || '',
      };
      // Only set default image if no image exists
      this.profileImage = currentProfile.image || this.defaultProfileImage;
      this.originalData = { ...this.profileData };
      this.isLoading = false;
      console.log('Using cached profile data:', currentProfile);
      return;
    }
    
    // If no cached profile, fetch from API
    this.userService.getUserProfile(userEmail)
      .pipe(
        catchError(error => {
          console.error('Error in getUserProfile:', error);
          this.errorMessage = 'Failed to load user profile. Using default profile data.';
          
          // Return a default response to continue the app flow
          return of({
            image: this.defaultProfileImage,
          } as ProfileResponse);
        })
      ).subscribe({
        next: (profile) => {
          // Update profile image only if we get a valid response
          this.profileImage = profile.image || this.defaultProfileImage;
          this.profileData = {
            image: profile.image || '',
          };
          this.originalData = { ...this.profileData };
        },
        error: (error) => {
          this.errorMessage = 'Failed to load user profile. Please try again later.';
          console.error('Failed to load user profile:', error);
          // Only set default image on error
          this.profileImage = this.defaultProfileImage;
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
    
    // Disconnect from notification service
    this.websocketService.disconnect();
    
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

  toggleNotificationsMenu(): void {
    this.showNotifications = !this.showNotifications;
    this.showProfileMenu = false; // Close profile menu when opening notifications
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    this.showNotifications = false; // Close notifications when opening profile menu
  }

  // Mark a notification as read
  markAsRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    if (this.currentUser?.email) {
      this.notificationService.markAllAsRead();
      console.log('Marked all notifications as read for user:', this.currentUser.email);
    }
  }

  // Handle notification click and redirect
  handleNotificationClick(notification: NotificationItem): void {
    // Close the notifications dropdown
    this.showNotifications = false;
    
    // Delegate to the notification service to handle the redirection
    this.notificationService.handleNotificationClick(notification);
  }

  // Close notifications dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    
    if (
      notificationIcon && 
      notificationDropdown && 
      this.showNotifications && 
      !notificationIcon.contains(event.target as Node) && 
      !notificationDropdown.contains(event.target as Node)
    ) {
      this.showNotifications = false;
    }
  }

  // Track notifications by their ID
  trackById(index: number, item: NotificationItem): number {
    return item.id;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.defaultProfileImage;
    }
  }

  /**
   * Fetch notifications from the server
   */
  fetchNotifications(): void {
    if (!this.currentUser?.email) {
      console.error('Cannot fetch notifications: User email not available');
      return;
    }
    
    console.log('Fetching notifications for user:', this.currentUser.email);
    
    // Show loading state
    this.isLoadingNotifications = true;
    
    // Fetch all notifications for the current user
    this.notificationService.fetchUserNotifications(this.currentUser.email)
      .subscribe({
        next: (notifications) => {
          console.log(`Successfully fetched ${notifications.length} notifications`);
          // Notifications are automatically updated in the service
        },
        error: (error) => {
          console.error('Error fetching notifications:', error);
        },
        complete: () => {
          // Hide loading state
          this.isLoadingNotifications = false;
        }
      });
  }

  /**
   * Fetch unread notifications count
   */
  fetchUnreadCount(): void {
    if (!this.currentUser?.email) {
      console.error('Cannot fetch unread count: User email not available');
      return;
    }
    
    // Tenant information
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      console.error('Cannot fetch unread count: User data not available');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      const tenant = userData.tenant || '';
      
      if (!tenant) {
        console.warn('No tenant information available, using default');
      }
      
      console.log(`Fetching unread count for user: ${this.currentUser.email}, tenant: ${tenant}`);
      
      // Show loading state (already set by fetchNotifications)
      this.notificationService.fetchUnreadNotificationsCount(this.currentUser.email, tenant)
        .subscribe({
          next: (count) => {
            console.log(`User has ${count} unread notifications`);
            // Count is automatically updated in the service
          },
          error: (error) => {
            console.error('Error fetching unread count:', error);
          }
        });
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }

  /**
   * Refreshes notification data
   * Use this after connection is re-established or when manually refreshing
   */
  refreshNotifications(): void {
    console.log('Refreshing notification data');
    this.isLoadingNotifications = true;
    
    // Create a promise to track completion of all requests
    const fetchPromise = new Promise<void>((resolve) => {
      this.fetchNotifications();
      this.fetchUnreadCount();
      
      // Set a timeout to ensure loading state is cleared even if requests don't complete
      setTimeout(() => resolve(), 3000);
    });
    
    // Clear loading state after all requests are complete or timeout
    fetchPromise.then(() => {
      this.isLoadingNotifications = false;
    });
  }

  /**
   * Handle WebSocket reconnection
   */
  handleWebSocketReconnection(connected: boolean): void {
    this.websocketConnected = connected;
    console.log(`WebSocket connection status: ${connected ? 'Connected' : 'Disconnected'}`);
    
    // If connection is established, refresh notifications
    if (connected) {
      console.log('Connection established, refreshing notifications');
      this.refreshNotifications();
    } else {
      console.log('Connection lost, notifications will be refreshed when reconnected');
    }
  }

  /**
   * Send a test notification (for testing)
   */
  sendTestNotification(): void {
    if (!this.currentUser?.email) {
      console.error('Cannot send test notification: User email not available');
      return;
    }
    
    const notification: any = {
      title: 'Test Notification',
      message: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
      type: 'info',
      recipientEmail: this.currentUser.email
    };
    
    this.notificationService.sendNotificationViaWebSocket(notification);
    console.log('Test notification sent');
  }

  /**
   * Setup WebSocket connection and notification handling
   */
  private setupNotifications(): void {
    if (!this.currentUser?.email) return;
    
    // Connect to WebSocket for real-time notifications
    this.websocketService.connect(this.currentUser.email);
    
    // Subscribe to WebSocket connection status
    this.subscription.add(
      this.websocketService.connectionStatus.subscribe(connected => {
        this.handleWebSocketReconnection(connected);
      })
    );
    
    // Initialize the notification service (this will load initial notifications)
    this.notificationService.initializeNotifications();
    
    // Setting a short timeout to ensure notifications are loaded after connection
    setTimeout(() => {
      // Initial fetch of notifications as a fallback
      if (this.notifications.length === 0) {
        console.log('No notifications loaded yet, refreshing...');
        this.refreshNotifications();
      }
    }, 1000);
  }
}
