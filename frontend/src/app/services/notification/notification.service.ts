import { inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService, JwtPayload } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../logger.service';

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
  private _socket: Socket | null = null;
  private _userId: string | null;

  private readonly _ngUnsubscribe = new Subject<void>();
  private readonly _socketReconnected$ = new Subject<boolean>();

  // Services
  private readonly _logger = inject(LoggerService);
  private readonly _authService = inject(AuthService);
  private readonly _http = inject(HttpClient);
  
  constructor() {
    this._userId = this.getLoggedInUserId();
    if (!this._userId) {
      this._logger.error('NotificationService: No user ID found for _socket connection.');
      return;
    }
    this.initializeSocket();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  // Socket Initialization & Connection Management
  getLoggedInUserId(): string | null {
    const token = this._authService.getAccessToken('User');
    if (token) {
      const payload = this._extractJwtPayload(token);
      return payload?.userId ?? null;
    }
    return null;
  }

  private _extractJwtPayload(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      this._logger.error('JWT Decode error:', error);
      return null;
    }
  }

  private initializeSocket(): void {
    if (!this._userId || this._socket) {
      if (this._socket) this._logger.warn('NotificationService: Socket already initialized.');
      return;
    }

    this._socket = io(`${environment.apiUrl}/notifications`, {
      transports: ['websocket'],
      query: { _userId: this._userId },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Socket Event Listeners
    this._socket.on('connect', () => {
      this._logger.info('Notification Socket connected. ID:', this._socket?.id);
      this._socketReconnected$.next(true);
    });

    this._socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      this._logger.warn('Notification Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        this._socket?.connect();
      }
    });

    this._socket.on('reconnect_attempt', (attemptNumber: number) => {
      this._logger.info(`Notification Socket reconnect attempt: ${attemptNumber}`);
    });

    this._socket.on('reconnect_error', (err: Error) => {
      this._logger.error('Notification Socket reconnect error:', err.message);
    });

    this._socket.on('reconnect_failed', () => {
      this._logger.error('Notification Socket reconnect failed. Will not try again.');
    });

    this._socket.on('reconnect', (attemptNumber: number) => {
      this._logger.info(`Notification Socket reconnected after ${attemptNumber} attempts.`);
    });

    this._socket.on('error', (err: any) => {
      this._logger.error('Notification Socket error:', err);
    });
  }

  connect(): void {
    if (!this._socket) {
      this.initializeSocket();
    } else if (this._socket.disconnected) {
      this._socket.connect();
    }
  }

  disconnect(): void {
    if (this._socket && this._socket.connected) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  reconnect(): void {
    if (!this._socket) {
      this.initializeSocket();
    } else if (this._socket.disconnected) {
      this._socket.connect();
    }
  }

  onSocketReconnected(): Observable<boolean> {
    return this._socketReconnected$.asObservable().pipe(takeUntil(this._ngUnsubscribe));
  }

  markNotificationAsRead(notificationId: string): void {
    if (this._socket && this._socket.connected) {
      this._socket.emit('markAsRead', notificationId);
    } else {
      this._logger.warn('Notification _socket not connected, cannot mark notification as read.');
    }
  }

  onInitialNotifications(): Observable<Notification[]> {
    return new Observable<Notification[]>(observer => {
      if (!this._socket) {
        this._logger.warn('Notification _socket not initialized for onInitialNotifications.');
        observer.next([]);
        return;
      }
      const listener = (notifications: Notification[]) => observer.next(notifications);
      this._socket.on('initialNotifications', listener);
      return () => {
        this._socket?.off('initialNotifications', listener);
      };
    }).pipe(takeUntil(this._ngUnsubscribe));
  }

  onNewNotification(): Observable<Notification> {
    return new Observable<Notification>(observer => {
      if (!this._socket) {
        this._logger.warn('Notification _socket not initialized for onNewNotification.');
        return;
      }
      const listener = (notification: Notification) => observer.next(notification);
      this._socket.on('newNotification', listener);
      return () => {
        this._socket?.off('newNotification', listener);
      };
    }).pipe(takeUntil(this._ngUnsubscribe));
  }

  onNotificationStatusUpdate(): Observable<{ notificationId: string; status: 'read' | 'unread' }> {
    return new Observable<{ notificationId: string; status: 'read' | 'unread' }>(observer => {
      if (!this._socket) {
        this._logger.warn('Notification _socket not initialized for onNotificationStatusUpdate.');
        return;
      }
      const listener = (update: { notificationId: string; status: 'read' | 'unread' }) => observer.next(update);
      this._socket.on('notificationStatusUpdate', listener);
      return () => {
        this._socket?.off('notificationStatusUpdate', listener);
      };
    }).pipe(takeUntil(this._ngUnsubscribe));
  }

  onSocketError(): Observable<any> {
    return new Observable(observer => {
      if (!this._socket) {
        this._logger.warn('Notification _socket not initialized for onSocketError.');
        return;
      }
      const listener = (err: any) => observer.next(err);
      this._socket.on('error', listener);
      return () => {
        this._socket?.off('error', listener);
      };
    }).pipe(takeUntil(this._ngUnsubscribe));
  }

  // Http Methods
  getNotifications(): Observable<Notification[]> {
    return this._http.get<Notification[]>(`${environment.apiUrl}/user/notifications`);
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this._http.get<Notification[]>(`${environment.apiUrl}/user/notifications/unread`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this._http.get<{ count: number }>(`${environment.apiUrl}/user/notifications/count`);
  }

  markAsReadHttp(notificationId: string): Observable<Notification> {
    return this._http.post<Notification>(`${environment.apiUrl}/user/notifications/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<{ success: boolean }> {
    return this._http.post<{ success: boolean }>(`${environment.apiUrl}/user/notifications/read-all`, {});
  }

  deleteNotification(notificationId: string): Observable<{ success: boolean }> {
    return this._http.delete<{ success: boolean }>(`${environment.apiUrl}/user/notifications/${notificationId}`);
  }

  fetchUnreadNotifications(): Observable<Notification[]> {
    return this._http.get<Notification[]>(`${environment.apiUrl}/user/notifications/unread`);
  }

  fetchAllNotifications(): Observable<Notification[]> {
    return this._http.get<Notification[]>(`${environment.apiUrl}/user/notifications`);
  }
}