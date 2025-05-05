import { Injectable, EventEmitter, Inject, Optional } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Notification } from '../models/notification.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { map, tap, catchError } from 'rxjs/operators';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  timeAgo: string;
  createdAt: Date;
  recipientEmail?: string;
  sourceId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notificationMessage = new EventEmitter<Notification>();
  
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notifications: NotificationItem[] = [];
  private apiUrl = 'http://localhost:8222/api/v1/notifications';

  // WebSocket service, injected through setter to avoid circular dependency
  private webSocketService: any;

  currentUserEmail: string = '';
  userId: number = 0;
  currentUserTenant: string = '';

  constructor(private http: HttpClient, private authService: AuthService) { 
    this.initUserInfo();
  }

  /**
   * Set the WebSocket service instance
   * This is used to avoid circular dependency
   */
  setWebSocketService(webSocketService: any): void {
    this.webSocketService = webSocketService;
  }

  private initUserInfo(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
    // Get user data from localStorage directly to access all properties
    const storedUser = localStorage.getItem('user');
    const userData = storedUser ? JSON.parse(storedUser) : {};
    
    this.currentUserTenant = userData.tenant || '';
    this.userId = parseInt(userData.id?.toString() || '0', 10);
    this.currentUserEmail = currentUser.email || '';
  }
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
   * Process a new notification received from WebSocket
   */
  processNotification(notification: Notification): void {
    // Create a formatted notification item
    const newNotification: NotificationItem = {
      id: notification.id || this.generateTempId(),
      title: notification.title || this.generateTitle(notification.type || 'info'),
      message: notification.message || 'New notification received',
      type: notification.type || 'info',
      read: false,
      timeAgo: 'Just now',
      sourceId: notification.sourceId || 0,
      createdAt: notification.createdAt || new Date(),
      recipientEmail: notification.recipientEmail || this.currentUserEmail
    };
    
    // Calculate timeAgo
    newNotification.timeAgo = this.formatTimeAgo(newNotification.createdAt);
    
    // Add to notifications array at the beginning (most recent first)
    this.notifications.unshift(newNotification);
    
    // Update observers
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadCount();
  }
  
  /**
   * Get observable stream of notifications
   */
  getNotifications(): Observable<NotificationItem[]> {
    return this.notificationsSubject.asObservable();
  }
  
  /**
   * Get observable for unread notification count
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }
  
  /**
   * Mark a notification as read
   */
  markAsRead(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.notificationsSubject.next([...this.notifications]);
      this.updateUnreadCount();
      
      // Call the API to mark the notification as read
      this.markNotificationAsReadApi(id).subscribe();
    }
  }
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    if (!this.currentUserEmail) {
      console.error('User email not available');
      return;
    }

    // First update the local state
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadCount();
    
    // Then call the API to mark all as read via WebSocket if available
    if (this.webSocketService) {
      this.webSocketService.markAllNotificationsAsRead(this.currentUserEmail);
    } else {
      // Fallback to HTTP API
      this.markAllNotificationsAsReadApi(this.currentUserEmail).subscribe();
    }
  }
  
  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.notifications = [];
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
  
  /**
   * Update the unread count
   */
  private updateUnreadCount(): void {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
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
        this.notificationsSubject.next([...this.notifications]);
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
        this.notificationsSubject.next([...this.notifications]);
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
        this.unreadCountSubject.next(count);
      }),
      catchError(error => {
        console.error('Error fetching unread count:', error);
        
        // Return 0 to avoid breaking the UI
        return of(0);
      })
    );
  }

  /**
   * Mark a notification as read via API
   */
  markNotificationAsReadApi(id: number): Observable<NotificationItem> {
    return this.http.put<NotificationItem>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read via API (HTTP fallback)
   */
  markAllNotificationsAsReadApi(email: string): Observable<NotificationItem[]> {
    // This would typically be handled via WebSocket, but for HTTP fallback:
    const payload = { email };
    return this.http.post<NotificationItem[]>(`${this.apiUrl}/mark-all-read`, payload);
  }

  /**
   * Create a new notification via API
   */
  createNotification(notification: NotificationItem): Observable<NotificationItem> {
    return this.http.post<NotificationItem>(this.apiUrl, notification).pipe(
      tap(createdNotification => {
        this.notifications.unshift(createdNotification);
        this.notificationsSubject.next([...this.notifications]);
        this.updateUnreadCount();
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
   * Initialize notifications for the current user
   * Call this method when the app initializes or user logs in
   */
  initializeNotifications(): void {
    if (!this.currentUserEmail) {
      console.error('User email not available for notification initialization');
      return;
    }
    
    console.log('Initializing notifications for user:', this.currentUserEmail);
    
    // First try to fetch from API, but handle errors gracefully
    this.fetchUserNotifications(this.currentUserEmail)
      .subscribe(notifications => {
        console.log('Fetched notifications:', notifications.length);
        
        // If notifications can't be fetched, we'll just use empty array
        // The error handling in fetchUserNotifications will ensure UI doesn't break
      });
    
    // If tenant is available, fetch unread count
    if (this.currentUserTenant) {
      this.fetchUnreadNotificationsCount(this.currentUserEmail, this.currentUserTenant)
        .subscribe(count => {
          console.log('Unread notifications count:', count);
          
          // Error handling in fetchUnreadNotificationsCount ensures UI doesn't break
        });
    }
  }
}