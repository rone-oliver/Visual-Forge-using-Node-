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
      return;
    }
    this.initializeSocket();
  }

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
    if (!this.userId || this.socket) {
      if (this.socket) console.warn('NotificationService: Socket already initialized.');
      return;
    }

    this.socket = io(`${environment.apiUrl}/notifications`, {
      transports: ['websocket'],
      query: { userId: this.userId },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // --- Socket Event Listeners ---
    this.socket.on('connect', () => {
      console.log('Notification Socket connected. ID:', this.socket?.id);
      this.socketReconnected$.next(true);
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.warn('Notification Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`Notification Socket reconnect attempt: ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (err: Error) => {
      console.error('Notification Socket reconnect error:', err.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Notification Socket reconnect failed. Will not try again.');
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Notification Socket reconnected after ${attemptNumber} attempts.`);
    });

    this.socket.on('error', (err: any) => {
      console.error('Notification Socket error:', err);
    });
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

  markNotificationAsRead(notificationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('markAsRead', notificationId);
    } else {
      console.warn('Notification socket not connected, cannot mark notification as read.');
    }
  }

  onInitialNotifications(): Observable<Notification[]> {
    return new Observable<Notification[]>(observer => {
      if (!this.socket) {
        console.warn('Notification socket not initialized for onInitialNotifications.');
        observer.next([]);
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