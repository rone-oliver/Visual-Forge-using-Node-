import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService, JwtPayload } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  _id: string;
  userId: string;
  message: string;
  unread: boolean;
  type: 'general' | 'chat' | 'work' | 'payment' | string;
  data?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private socket: Socket | null = null;
  private userId: string | null;
  private readonly ngUnsubscribe = new Subject<void>();
  private socketReconnected$ = new Subject<boolean>();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.userId = this.getLoggedInUserId();
    if (!this.userId) {
      console.error('NotificationService: No user ID found for socket connection.');
      // You might want to throw an error or handle this more gracefully,
      // e.g., by redirecting to login or showing a message.
      return;
    }
    // Initialize the socket upon service creation if userId is available
    this.initializeSocket();
  }

  // --- Lifecycle Hooks ---
  ngOnDestroy(): void {
    this.disconnect();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  // --- Socket Initialization & Connection Management ---
  getLoggedInUserId(): string | null {
    const token = this.authService.getAccessToken('User');
    if (token) {
      const payload = this.extractJwtPayload(token);
      return payload?.userId ?? null;
    }
    return null;
  }
  private extractJwtPayload(token: string): JwtPayload | null {
      try {
        return jwtDecode<JwtPayload>(token);
      } catch (error) {
        console.error('JWT Decode error:', error);
        return null;
      }
  }

  private initializeSocket(): void {
    // Prevent re-initialization if already connected or connecting
    if (!this.userId || this.socket) {
      if (this.socket) console.warn('NotificationService: Socket already initialized.');
      return;
    }

    this.socket = io(`${environment.apiUrl}/notifications`, {
      transports: ['websocket'], // Prefer WebSockets
      query: { userId: this.userId }, // Pass user ID for authentication/identification
      autoConnect: true, // Attempt to connect immediately
      reconnection: true, // Enable automatic reconnection
      reconnectionAttempts: Infinity, // Unlimited reconnection attempts
      reconnectionDelay: 1000, // Wait 1 second before retrying
      reconnectionDelayMax: 5000, // Max 5 seconds between retries
      timeout: 20000, // Connection timeout
    });

    // --- Socket Event Listeners ---
    this.socket.on('connect', () => {
      console.log('Notification Socket connected. ID:', this.socket?.id);
      // You can emit an event here to fetch initial unread notifications
      // if your backend has a specific event for that after connection.
      // E.g., this.socket.emit('getUnreadNotifications');
      this.socketReconnected$.next(true);
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.warn('Notification Socket disconnected:', reason);
      // Handle disconnects, e.g., show a message to the user
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('Notification Socket connection error:', err.message);
      // Handle connection errors, e.g., display an error message
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`Notification Socket reconnect attempt: ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (err: Error) => {
      console.error('Notification Socket reconnect error:', err.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Notification Socket reconnection failed permanently.');
      // Notify user, offer manual reconnect
    });

    this.setupErrorHandling();
  }

  connect(): void {
    if (!this.socket) {
      this.initializeSocket(); // Initialize if not already
    } else if (this.socket.disconnected) {
      this.socket.connect(); // Reconnect if disconnected
    }
  }

  disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
      this.socket = null; // Clear the instance to allow re-initialization if needed
    }
  }

  reconnect(): void {
    if (!this.socket) {
      this.initializeSocket();
    } else if (this.socket.disconnected) {
      this.socket.connect();
    }
  }

  onSocketReconnected(): Observable<boolean> {
    return this.socketReconnected$.asObservable().pipe(takeUntil(this.ngUnsubscribe));
  }

  // --- Emitting Events to Backend ---

  // Call this when a notification is displayed or explicitly marked as read
  markNotificationAsRead(notificationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('markAsRead', notificationId);
    } else {
      console.warn('Notification socket not connected, cannot mark notification as read.');
    }
  }

  // --- Listening for Events from Backend ---

  onInitialNotifications(): Observable<Notification[]> {
    return new Observable<Notification[]>(observer => {
      if (!this.socket) {
        console.warn('Notification socket not initialized for onInitialNotifications.');
        observer.next([]); // Emit an empty array or handle error
        return;
      }
      const listener = (notifications: Notification[]) => observer.next(notifications);
      this.socket.on('initialNotifications', listener);
      return () => {
        this.socket?.off('initialNotifications', listener);
      };
    }).pipe(takeUntil(this.ngUnsubscribe));
  }

  onNewNotification(): Observable<Notification> {
    return new Observable<Notification>(observer => {
      if (!this.socket) {
        console.warn('Notification socket not initialized for onNewNotification.');
        // Optionally, throw an error or handle this case
        return;
      }
      const listener = (notification: Notification) => observer.next(notification);
      this.socket.on('newNotification', listener);
      return () => {
        this.socket?.off('newNotification', listener);
      };
    }).pipe(takeUntil(this.ngUnsubscribe));
  }

  onNotificationStatusUpdate(): Observable<{ notificationId: string; status: 'read' | 'unread' }> {
    return new Observable<{ notificationId: string; status: 'read' | 'unread' }>(observer => {
      if (!this.socket) {
        console.warn('Notification socket not initialized for onNotificationStatusUpdate.');
        return;
      }
      const listener = (update: { notificationId: string; status: 'read' | 'unread' }) => observer.next(update);
      this.socket.on('notificationStatusUpdate', listener);
      return () => {
        this.socket?.off('notificationStatusUpdate', listener);
      };
    }).pipe(takeUntil(this.ngUnsubscribe));
  }

  // You might want a general error handler for socket-related issues
  onSocketError(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        console.warn('Notification socket not initialized for onSocketError.');
        return;
      }
      const listener = (err: any) => observer.next(err);
      this.socket.on('error', listener); // Generic socket error event
      return () => {
        this.socket?.off('error', listener);
      };
    }).pipe(takeUntil(this.ngUnsubscribe));
  }

  private setupErrorHandling(): void {
    if (!this.socket) return;
    
    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      // Try to reconnect after a delay
      setTimeout(() => this.reconnect(), 5000);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        setTimeout(() => this.reconnect(), 5000);
      }
      // else the socket will automatically try to reconnect
    });
  }

  // Http Methods
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/user/notifications`);
  }
  
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/user/notifications/unread`);
  }
  
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${environment.apiUrl}/user/notifications/count`);
  }
  
  markAsReadHttp(notificationId: string): Observable<Notification> {
    return this.http.post<Notification>(`${environment.apiUrl}/user/notifications/${notificationId}/read`, {});
  }
  
  markAllAsRead(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/user/notifications/read-all`, {});
  }
  
  deleteNotification(notificationId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${environment.apiUrl}/user/notifications/${notificationId}`);
  }

  fetchUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/user/notifications/unread`);
  }
  
  fetchAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/user/notifications`);
  }
}