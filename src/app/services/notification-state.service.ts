import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  sourceType?: string;
  actionType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationStateService {
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  
  // User information
  currentUserEmail: string = '';
  currentUserTenant: string = '';
  userId: number = 0;

  constructor() { }

  // Notifications methods
  getNotifications(): Observable<NotificationItem[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCountSubject.asObservable();
  }

  updateNotifications(notifications: NotificationItem[]): void {
    this.notificationsSubject.next(notifications);
  }

  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  // User methods
  setUserInfo(email: string, tenant: string = '', userId: number = 0): void {
    this.currentUserEmail = email;
    this.currentUserTenant = tenant;
    this.userId = userId;
  }

  clearUserInfo(): void {
    this.currentUserEmail = '';
    this.currentUserTenant = '';
    this.userId = 0;
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
} 