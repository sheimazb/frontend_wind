import { Injectable } from '@angular/core';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import { WEBSOCKET_ENDPOINT, WEBSOCKET_NOTIFY_TOPIC } from '../constants/base-url.constants';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private stompClient: Client | null = null;
  private userEmail: string | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private isConnecting = false;
  
  // Connection status subject for components to subscribe to
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  constructor(private notificationService: NotificationService) { }
  
  /**
   * Get the current connection status
   */
  get connectionStatus() {
    return this.connectionStatusSubject.asObservable();
  }
  
  /**
   * Check if the client is currently connected
   */
  get isConnected(): boolean {
    return !!this.stompClient?.connected;
  }

  /**
   * Connect to WebSocket server
   * @param email Optional user email for user-specific notifications
   */
  connect(email?: string): void {
    // Prevent multiple connection attempts
    if (this.isConnecting) {
      console.log('Already attempting to connect to WebSocket');
      return;
    }
    
    // Reset connection state if reconnecting
    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch (e) {
        console.error('Error deactivating previous connection:', e);
      }
      this.stompClient = null;
    }
    
    this.isConnecting = true;
    console.log('Initiating WebSocket Connection');
    
    // Store user email if provided
    if (email) {
      this.userEmail = email;
    }
    
    // Create the STOMP client
    this.stompClient = new Client();
    
    // Configure client
    this.stompClient.brokerURL = WEBSOCKET_ENDPOINT;
    
    // Debug settings
    this.stompClient.debug = (str) => {
      if (environment.production === false) {
        console.log('STOMP: ' + str);
      }
    };
    
    // Reconnect settings
    this.stompClient.reconnectDelay = 5000;
    this.stompClient.heartbeatIncoming = 4000;
    this.stompClient.heartbeatOutgoing = 4000;

    // Connect handling
    this.stompClient.onConnect = (frame: IFrame) => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.connectionStatusSubject.next(true);
      console.log('Connected to WebSocket: ' + frame);
      
      // Subscribe to global notifications - only process if intended for this user
      this.stompClient!.subscribe(WEBSOCKET_NOTIFY_TOPIC, (message: IMessage) => {
        this.handleNotification(message, true);
      });
      
      // Subscribe to user-specific notifications if email is provided
      if (this.userEmail) {
        const userTopic = `/user/${this.userEmail}/topic/notifications`;
        this.stompClient!.subscribe(userTopic, (message: IMessage) => {
          // For user-specific channel, no need to check recipient
          this.handleNotification(message, false);
        });
      }
    };

    // On error, log details and try to reconnect
    this.stompClient.onStompError = (frame: IFrame) => {
      this.isConnecting = false;
      this.connectionStatusSubject.next(false);
      console.error('STOMP Error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
      
      this.handleReconnect();
    };
    
    // Set up disconnect handler
    this.stompClient.onWebSocketClose = () => {
      this.isConnecting = false;
      this.connectionStatusSubject.next(false);
      console.log('WebSocket connection closed');
      
      this.handleReconnect();
    };

    // Activate the client
    try {
      this.stompClient.activate();
    } catch (e) {
      this.isConnecting = false;
      console.error('Error activating STOMP client:', e);
      this.handleReconnect();
    }
  }

  /**
   * Handle reconnection attempts
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectAttempts * 2000; // Exponential backoff
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(() => {
        this.connect(this.userEmail || undefined);
      }, delay);
    } else {
      console.error('Maximum reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient) {
      try {
        if (this.stompClient.connected) {
          this.stompClient.deactivate();
          console.log('Disconnected from WebSocket');
        }
      } catch (e) {
        console.error('Error disconnecting from WebSocket:', e);
      } finally {
        this.stompClient = null;
        this.connectionStatusSubject.next(false);
        this.reconnectAttempts = 0;
      }
    }
  }

  /**
   * Handle a notification message
   * @param message The message from WebSocket
   * @param checkRecipient Whether to check if this user is the intended recipient
   */
  private handleNotification(message: IMessage, checkRecipient: boolean): void {
    console.log('Message Received from Server:', message.body);
    try {
      const notification = JSON.parse(message.body) as Notification;
      
      // If checking recipient is required, verify this notification is for current user
      if (checkRecipient) {
        if (!notification.recipientEmail || notification.recipientEmail !== this.userEmail) {
          console.log('Notification not for this user, ignoring:', notification);
          return; // Skip this notification as it's not for this user
        }
      }
      
      console.log('Processing notification for user:', this.userEmail);
      
      // Emit message through the notification service
      this.notificationService.notificationMessage.emit(notification);
      
      // Process the notification to update UI
      this.notificationService.processNotification(notification);
    } catch (error) {
      console.error('Error processing notification message:', error);
    }
  }

  /**
   * Send a notification via WebSocket
   * @param notification The notification to send
   * @returns boolean indicating if the send was attempted
   */
  sendNotification(notification: Notification): boolean {
    if (!this.ensureConnection()) {
      return false;
    }

    try {
      this.stompClient!.publish({
        destination: '/app/notification.send',
        body: JSON.stringify(notification)
      });
      console.log('Sent notification:', notification);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send a private notification to a specific user
   * @param notification The notification to send
   * @param recipientEmail The email of the recipient
   * @returns boolean indicating if the send was attempted
   */
  sendPrivateNotification(notification: Notification, recipientEmail: string): boolean {
    if (!this.ensureConnection()) {
      return false;
    }

    // Make sure the notification has the recipient email
    notification.recipientEmail = recipientEmail;

    try {
      this.stompClient!.publish({
        destination: '/app/notification.private',
        body: JSON.stringify(notification)
      });
      console.log('Sent private notification to:', recipientEmail, notification);
      return true;
    } catch (error) {
      console.error('Error sending private notification:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param email The email of the user
   * @returns boolean indicating if the send was attempted
   */
  markAllNotificationsAsRead(email: string): boolean {
    if (!this.ensureConnection()) {
      return false;
    }

    try {
      this.stompClient!.publish({
        destination: '/app/notification.markAllAsRead',
        body: JSON.stringify({ email })
      });
      console.log('Sent request to mark all notifications as read for:', email);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Ensure the client is connected before sending messages
   * @returns boolean indicating if connected
   */
  private ensureConnection(): boolean {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('STOMP client is not connected');
      
      // Try to reconnect if not currently connecting
      if (!this.isConnecting) {
        this.handleReconnect();
      }
      
      return false;
    }
    return true;
  }
}