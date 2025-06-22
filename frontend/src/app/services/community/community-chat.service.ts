import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService, JwtPayload } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { Community, CommunityMessage } from '../../interfaces/community.interface';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private socket: Socket | null = null;
  private userId: string | null;
  private messageSubject = new BehaviorSubject<CommunityMessage[]>([]);
  public messages$ = this.messageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.userId = this.getLoggedInUserId();
    this.initializeSocket();
  }

  private getLoggedInUserId(): string | null {
    const token = this.authService.getAccessToken('User'); // Or 'Editor' if appropriate
    if (token) {
      try {
        const payload = jwtDecode<JwtPayload>(token);
        return payload?.userId ?? null;
      } catch (error) {
        console.error('JWT Decode error:', error);
        return null;
      }
    }
    return null;
  }

  private initializeSocket(): void {
    const token = this.authService.getAccessToken('User');
    if (!this.userId || !token) {
        console.error('User not authenticated, cannot connect to community chat.');
        return;
    }

    this.socket = io(`${environment.apiUrl}/community`, {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${token}`
      },
      autoConnect: true,
      reconnection: true
    });

    this.socket.on('connect', () => {
      console.log('Community socket connected');
    });

    this.socket.on('disconnect', () => {
      console.warn('Community socket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Community socket connection error:', err);
    });

    this.socket.on('newMessage', (message: CommunityMessage) => {
        const currentMessages = this.messageSubject.getValue();
        this.messageSubject.next([...currentMessages, message]);
    });
  }

  joinCommunity(communityId: string): void {
    this.socket?.emit('joinCommunity', communityId);
  }

  leaveCommunity(communityId: string): void {
    if (this.socket) {
      this.socket.emit('leaveCommunity', communityId);
    }
  }

  sendMessage(communityId: string, content: string): void {
    if (!this.socket) {
      console.error('Socket is not connected.');
      return;
    }
    if (!this.userId) {
      console.error('Cannot send message, user ID is not available.');
      return;
    }
    this.socket.emit('sendMessage', { communityId, content });
  }

  getCommunities(): Observable<Community[]> {
    return this.http.get<Community[]>(`${environment.apiUrl}/editor/community`);
  }

  getCommunityById(id: string): Observable<Community> {
    return this.http.get<Community>(`${environment.apiUrl}/editor/community/${id}`);
  }

  createCommunity(name: string, description: string): Observable<Community> {
    return this.http.post<Community>(`${environment.apiUrl}/editor/community`, { name, description });
  }

  addMember(communityId: string, userId: string): Observable<Community> {
    return this.http.post<Community>(`${environment.apiUrl}/editor/community/${communityId}/members`, { userId });
  }

  getMessages(communityId: string): Observable<CommunityMessage[]> {
    return this.http.get<CommunityMessage[]>(`${environment.apiUrl}/editor/community/${communityId}/messages`);
  }

  loadMessages(communityId: string): void {
    this.getMessages(communityId).subscribe(messages => {
        this.messageSubject.next(messages);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }
}
