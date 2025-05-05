import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <div *ngFor="let notification of notifications" class="notification-item">
        {{ notification.message }}
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }
    .notification-item {
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      padding: 15px;
      margin-bottom: 10px;
      min-width: 200px;
      max-width: 300px;
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications()
      .subscribe(
        (notification) => {
          this.notifications.unshift(notification);
          // Optional: Remove notification after some time
          setTimeout(() => {
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
              this.notifications.splice(index, 1);
            }
          }, 5000);
        },
        (error) => console.error('Error receiving notification:', error)
      );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.notificationService.disconnect();
  }
} 