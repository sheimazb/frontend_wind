import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './services/notification.service';
import { WebsocketService } from './services/websocket.service';
import { Subscription } from 'rxjs';
import { Notification } from './models/notification.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'windlogs';

  private subscription = new Subscription();
  
  constructor(
    private notificationService: NotificationService,
    private webSocketService: WebsocketService
  ) {
    // Setup circular dependency
    this.notificationService.setWebSocketService(this.webSocketService);
  }
  
  ngOnInit() {
    this.connectToWebSocket();
    
    // Subscribe to notification events
    this.subscription.add(
      this.notificationService.notificationMessage.subscribe((notification: Notification) => {
        this.showBrowserNotification(notification);
      })
    );
  }
  
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  private connectToWebSocket() {
    // Connection is now handled in navbar component for each logged-in user
    console.log('WebSocket connection will be established when user logs in');
  }
  
  private showBrowserNotification(notification: Notification) {
    if (!('Notification' in window)) {
      console.log('Browser does not support desktop notification');
      return;
    }
    
    console.log('Processing browser notification:', notification);
    
    // Check if this notification is for the current user
    const currentUserEmail = this.notificationService.currentUserEmail;
    if (notification.recipientEmail && notification.recipientEmail !== currentUserEmail) {
      console.log('Notification not for current user, skipping browser notification');
      return;
    }

    // TypeScript doesn't know about the Notification API, so we need to cast
    const notificationAPI = window['Notification'] as any;

    if (notificationAPI.permission === 'granted') {
      this.createBrowserNotification(notification);
    } else if (notificationAPI.permission !== 'denied') {
      notificationAPI.requestPermission().then((permission: string) => {
        if (permission === 'granted') {
          this.createBrowserNotification(notification);
        }
      });
    }
  }
  
  private createBrowserNotification(notification: Notification) {
    const title = notification.title || 'New Notification';
    const options = {
      body: notification.message || 'You have a new notification',
      icon: '/assets/images/notification-icon.png', // Provide a path to your notification icon
      tag: `notification-${notification.id}`,
      requireInteraction: true
    };
    
    try {
      const browserNotification = new (window as any).Notification(title, options);
      
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
      
      setTimeout(() => {
        browserNotification.close();
      }, 10000); // Close after 10 seconds
    } catch (error) {
      console.error('Error creating browser notification:', error);
    }
  }
}
