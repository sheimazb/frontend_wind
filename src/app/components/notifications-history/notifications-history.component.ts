import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { NotificationStateService, NotificationItem } from '../../services/notification-state.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-history.component.html',
  styleUrl: './notifications-history.component.css'
})
export class NotificationsHistoryComponent implements OnInit, OnDestroy {
  // Notifications data
  allNotifications: NotificationItem[] = [];
  filteredNotifications: NotificationItem[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  
  // Filtering
  filterType: string = 'all'; // 'all', 'read', 'unread'
  filterSource: string = 'all'; // 'all', 'LOG', 'COMMENT', 'SOLUTION', etc.
  searchTerm: string = '';
  
  // Make Math available to the template
  Math = Math;
  
  // Subscriptions
  private notificationSubscription: Subscription | undefined;

  constructor(
    private notificationService: NotificationService,
    private notificationState: NotificationStateService
  ) {}

  // Helper method to check if there are unread notifications
  hasUnreadNotifications(): boolean {
    return this.filteredNotifications.some(notification => !notification.read);
  }

  ngOnInit(): void {
    this.loadNotifications();
    
    // Subscribe to notification updates
    this.notificationSubscription = this.notificationService.getNotifications()
      .subscribe(notifications => {
        this.allNotifications = [...notifications];
        this.applyFilters();
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    
    // Get current user email from the notification state service
    const userEmail = this.notificationState.currentUserEmail;
    
    if (!userEmail) {
      this.error = 'User not logged in';
      this.isLoading = false;
      return;
    }
    
    // Fetch notifications from the service
    this.notificationService.fetchUserNotifications(userEmail)
      .subscribe({
        next: (notifications) => {
          this.allNotifications = notifications;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading notifications:', err);
          this.error = 'Failed to load notifications. Please try again.';
          this.isLoading = false;
        }
      });
  }

  refreshNotifications(): void {
    this.loadNotifications();
  }

  applyFilters(): void {
    // Start with all notifications
    let filtered = [...this.allNotifications];
    
    // Apply read/unread filter
    if (this.filterType === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (this.filterType === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }
    
    // Apply source type filter
    if (this.filterSource !== 'all') {
      filtered = filtered.filter(n => n.sourceType === this.filterSource);
    }
    
    // Apply search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(term) || 
        n.message.toLowerCase().includes(term)
      );
    }
    
    // Update filtered notifications
    this.filteredNotifications = filtered;
    
    // Update pagination
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedNotifications(): NotificationItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredNotifications.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  handleNotificationClick(notification: NotificationItem): void {
    this.notificationService.handleNotificationClick(notification);
  }

  // Helper method to get an array of page numbers for pagination
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate middle pages
      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      // Adjust if at the beginning or end
      if (this.currentPage <= 2) {
        endPage = 3;
      } else if (this.currentPage >= this.totalPages - 1) {
        startPage = this.totalPages - 2;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < this.totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Always show last page
      pages.push(this.totalPages);
    }
    
    return pages;
  }
}
