import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { catchError, Observable, of } from 'rxjs';
import { JwtPayload } from '../auth.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface Message {
  _id?: string;
  sender: string;
  recipient: string;
  content: string;
  createdAt?: Date;
  timestamp?: Date;
  status: 'sent' | 'delivered' | 'read';
  isOutgoing?: boolean;
}

export interface ChatItem {
  _id: string;
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private userId: string | null;
  private socket: Socket | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
  ) {
    this.userId = this.getLoggedInUserId();
    if (!this.userId) {
      console.error('No user ID found');
      return;
    }
    this.initializeSocket();
  }

  private initializeSocket() {
    if (!this.userId) return;

    this.socket = io(`${environment.apiUrl}/chat`, {
      transports: ['websocket'],
      query: { userId: this.userId },
      autoConnect: true,
      reconnection: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.warn('Socket disconnected, trying to reconnect...');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }

  private extractJwtPayload(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('JWT Decode error:', error);
      return null;
    }
  }

  getLoggedInUserId(): string | null {
    const token = this.authService.getAccessToken('User');
    if (token) {
      const payload = this.extractJwtPayload(token);
      return payload?.userId ?? null;
    }
    return null;
  }

  getChatList() {
    return this.http.get<ChatItem[]>(`${environment.apiUrl}/user/chats/list`);
  }

  createNewChat(userId: string): Observable<ChatItem> {
    return this.http.post<ChatItem>(`${environment.apiUrl}/user/chats`, { recipientId: userId })
      .pipe(
        catchError(error => {
          console.error('Error creating new chat:', error);
          throw error;
        })
      );
  }

  getMessagesBetweenUsers(recipientId: string) {
    return this.http.get<Message[]>(`${environment.apiUrl}/user/chats/messages/${recipientId}`);
  }

  sendMessage(recipientId: string, content: string): void {
    this.socket?.emit('sendMessage', { recipientId, content });
  }

  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket?.on('newMessage', (message: Message) => observer.next(message));
      return () => this.socket?.off('newMessage');
    });
  }

  onConnected(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('connected', (data) => observer.next(data));
      return () => this.socket?.off('connected');
    });
  }

  onMessageError(): Observable<any> {
    return new Observable(observer => {
      this.socket?.on('messageError', (err) => observer.next(err));
      return () => this.socket?.off('messageError');
    });
  }

  updateMessageStatus(messageId: string, status: 'delivered' | 'read'): void {
    this.socket?.emit('updateMessageStatus', { messageId, status });
  }

  onMessageStatusUpdate(): Observable<{ messageId: string, status: 'delivered' | 'read' }> {
    return new Observable(observer => {
      this.socket?.on('messageStatusUpdate', (update) => observer.next(update));
      return () => this.socket?.off('messageStatusUpdate');
    });
  }

  getUserInfo(userId: string) {
    return this.http.get<{
      username: string;
      profileImage?: string;
      isOnline?: boolean;
    }>(`${environment.apiUrl}/user/chats/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching user info:', error);
        return of({
          username: 'Unknown User',
          profileImage: null,
          isOnline: false
        });
      })
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  reconnect(): void {
    if (!this.socket?.connected) {
      this.initializeSocket();
    }
  }
} 
