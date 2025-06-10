import { Injectable, EventEmitter } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Notification } from '../models/notification.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user.model';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificationStateService, NotificationItem } from './notification-state.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notificationMessage = new EventEmitter<Notification>();
  
  private notifications: NotificationItem[] = [];
  private apiUrl = 'http://localhost:8222/api/v1/notifications';

  // WebSocket service, injected through setter to avoid circular dependency
  private webSocketService: any;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private notificationState: NotificationStateService
  ) { }

  /**
   * Set the WebSocket service instance
   * This is used to avoid circular dependency
   */
  setWebSocketService(webSocketService: any): void {
    this.webSocketService = webSocketService;
  }

  /**
   * Get current user email from state service
   */
  get currentUserEmail(): string {
    return this.notificationState.currentUserEmail;
  }

  /**
   * Get current user tenant from state service
   */
  get currentUserTenant(): string {
    return this.notificationState.currentUserTenant;
  }

  /**
   * Get observable stream of notifications
   */
  getNotifications(): Observable<NotificationItem[]> {
    return this.notificationState.getNotifications();
  }

  /**
   * Get observable stream of unread count
   */
  getUnreadCount(): Observable<number> {
    return this.notificationState.getUnreadCount();
  }

  /**
   * Process a new notification received from WebSocket
   */
  processNotification(notification: Notification): void {
    // Create a formatted notification item
    const newNotification: NotificationItem = {
      id: notification.id || this.generateTempId(),
      title: notification.subject || this.generateTitle(notification.type || 'info'),
      message: notification.message || 'New notification received',
      type: notification.type || 'info',
      read: false,
      timeAgo: 'Just now',
      sourceId: notification.sourceId || 0,
      sourceType: notification.sourceType || '',
      actionType: notification.actionType || '',
      createdAt: notification.createdAt || new Date(),
      recipientEmail: notification.recipientEmail || this.currentUserEmail
    };
    
    // Calculate timeAgo
    newNotification.timeAgo = this.formatTimeAgo(newNotification.createdAt);
    
    // Add to notifications array at the beginning (most recent first)
    this.notifications.unshift(newNotification);
    
    // Update observers
    this.notificationState.updateNotifications([...this.notifications]);
    this.updateUnreadCount();
  }

  /**
   * Update the unread count
   */
  private updateUnreadCount(): void {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    this.notificationState.updateUnreadCount(unreadCount);
  }

  /**
   * Initialize notifications for the current user
   * This should be called after login or when WebSocket connection is established
   */
  initializeNotifications(): void {
    console.log('Initializing notifications for user:', this.currentUserEmail);
    
    // Reset notifications first to ensure we don't mix with previous user's data
    this.notifications = [];
    this.notificationState.updateNotifications([]);
    
    // Only proceed if we have a user email
    if (!this.currentUserEmail) {
      console.warn('Cannot initialize notifications: No user email set');
      return;
    }
    
    // Fetch notifications and unread count
    this.fetchUserNotifications(this.currentUserEmail).subscribe();
    this.fetchUnreadNotificationsCount(this.currentUserEmail, this.currentUserTenant).subscribe();
  }

  /**
   * Reset all notification data
   * This should be called when a user logs out
   */
  resetNotifications(): void {
    console.log('Resetting notification data');
    this.notifications = [];
    this.notificationState.clearUserInfo();
  }

  /**
   * Format a date to a human-readable timeAgo string
   */
  formatTimeAgo(date: Date): string {
    if (!date) return 'Unknown time';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Convert milliseconds to seconds
    const seconds = Math.floor(diff / 1000);
    
    // Less than a minute
    if (seconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (seconds < 604800) {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // More than a week, format as date
    return date.toLocaleDateString();
  }

  /**
   * Generate a temporary ID for notifications without one
   */
  private generateTempId(): number {
    return Date.now();
  }

  /**
   * Generate a title based on notification type
   */
  private generateTitle(type: string): string {
    switch (type.toLowerCase()) {
      case 'error':
        return 'Error';
      case 'warning':
      case 'warn':
        return 'Warning';
      case 'success':
        return 'Success';
      case 'info':
      default:
        return 'Information';
    }
  }

  // API Methods matching the backend controller

  /**
   * Fetch all notifications for a user from the API
   */
  fetchUserNotifications(email: string): Observable<NotificationItem[]> {
    const params = new HttpParams().set('email', email);
    
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(notifications => {
        // Format timeAgo for each notification and ensure proper date conversion
        return notifications.map(notification => {
          // Convert string date to Date object 
          const createdAt = notification.createdAt 
            ? new Date(notification.createdAt) 
            : new Date();
            
          return {
            ...notification,
            createdAt: createdAt,
            timeAgo: this.formatTimeAgo(createdAt)
          };
        });
      }),
      tap(notificationItems => {
        this.notifications = notificationItems;
        this.notificationState.updateNotifications([...this.notifications]);
        this.updateUnreadCount();
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        
        // Return empty array to avoid breaking the UI
        return of([]);
      })
    );
  }

  /**
   * Fetch unread notifications for a user from the API
   */
  fetchUnreadNotifications(email: string, tenant: string): Observable<NotificationItem[]> {
    const params = new HttpParams()
      .set('email', email)
      .set('tenant', tenant);
    
    return this.http.get<NotificationItem[]>(`${this.apiUrl}/unread`, { params }).pipe(
      tap(notificationItems => {
        // Update local notifications to mark which ones are unread
        const unreadIds = new Set(notificationItems.map(n => n.id));
        this.notifications.forEach(n => {
          if (unreadIds.has(n.id)) {
            n.read = false;
          }
        });
        this.notificationState.updateNotifications([...this.notifications]);
        this.updateUnreadCount();
      }),
      catchError(error => {
        console.error('Error fetching unread notifications:', error);
        
        // Return empty array to avoid breaking the UI
        return of([]);
      })
    );
  }

  /**
   * Get count of unread notifications from the API
   */
  fetchUnreadNotificationsCount(email: string, tenant: string): Observable<number> {
    const params = new HttpParams()
      .set('email', email)
      .set('tenant', tenant);
    
    return this.http.get<number>(`${this.apiUrl}/unread/count`, { params }).pipe(
      tap(count => {
        this.notificationState.updateUnreadCount(count);
      }),
      catchError(error => {
        console.error('Error fetching unread count:', error);
        
        // Return 0 to avoid breaking the UI
        return of(0);
      })
    );
  }

  /**
   * Send a notification via WebSocket
   */
  sendNotificationViaWebSocket(notification: Notification): void {
    if (this.webSocketService) {
      this.webSocketService.sendNotification(notification);
    } else {
      console.error('WebSocket service not available');
      // Fallback to local processing for demo purposes
      this.processNotification(notification);
    }
  }

  /**
   * Send a private notification via WebSocket
   */
  sendPrivateNotificationViaWebSocket(notification: Notification, recipientEmail: string): void {
    if (this.webSocketService) {
      this.webSocketService.sendPrivateNotification(notification, recipientEmail);
    } else {
      console.error('WebSocket service not available');
      // Fallback to local processing if it's for the current user
      if (recipientEmail === this.currentUserEmail) {
        this.processNotification(notification);
      }
    }
  }

  /**
   * Handle notification click and redirect based on sourceType
   * @param notification The notification that was clicked
   */
  handleNotificationClick(notification: NotificationItem): void {
    // First mark the notification as read
    this.markAsRead(notification.id);
    
    // If no sourceType or sourceId, do nothing
    if (!notification.sourceType || !notification.sourceId) {
      console.log('Notification has no source type or ID for redirection');
      return;
    }
    
    console.log(`Handling notification click: ${notification.sourceType} with ID ${notification.sourceId}`);
    
    // Redirect based on sourceType
    switch (notification.sourceType.toUpperCase()) {
      case 'COMMENT':
        // Redirect to the comment with the given sourceId
        this.router.navigate(['/dashboard/issues-details', notification.sourceId], {
          queryParams: { focusComment: true }
        });
        break;
        
      case 'SOLUTION':
        // Redirect to the solution with the given sourceId
        this.router.navigate(['/dashboard/issues-details', notification.sourceId], {
          queryParams: { focusSolution: true }
        });
        break;
        
      case 'LOG':
        // Redirect to the issue with the given sourceId
        this.router.navigate(['/dashboard/issues-details', notification.sourceId]);
        break;
        
      default:
        console.log(`Notification has no valid source type for redirection`);
    }
  }

  /**
   * Mark a notification as read
   * @param id The notification ID to mark as read
   */
  markAsRead(id: number): void {
    // Find the notification in our local array
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notificationState.updateNotifications([...this.notifications]);
      this.updateUnreadCount();
      
      // Call API to update in backend
      this.http.put(`${this.apiUrl}/${id}/read`, {}).subscribe({
        next: () => console.log('Notification marked as read on server'),
        error: (err) => console.error('Error marking notification as read:', err)
      });
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  markAllAsRead(): void {
    // Update all notifications in our local array
    this.notifications.forEach(n => n.read = true);
    this.notificationState.updateNotifications([...this.notifications]);
    this.notificationState.updateUnreadCount(0);
    
    // Call API to update in backend
    const email = this.notificationState.currentUserEmail;
    if (email) {
      this.http.put(`${this.apiUrl}/mark-all-read`, { email }).subscribe({
        next: () => console.log('All notifications marked as read on server'),
        error: (err) => console.error('Error marking all notifications as read:', err)
      });
    }
  }
}