import { inject, Injectable } from '@angular/core';
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
  private _socket: Socket | null = null;
  private _userId: string | null;
  private readonly _messageSubject = new BehaviorSubject<CommunityMessage[]>([]);
  public readonly _messages$ = this._messageSubject.asObservable();

  // Services

  private readonly _http = inject(HttpClient);
  private readonly _authService = inject(AuthService);

  constructor() {
    this._userId = this.getLoggedInUserId();
    this.initializeSocket();
  }

  private getLoggedInUserId(): string | null {
    const token = this._authService.getAccessToken('User'); // Or 'Editor' if appropriate
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
    const token = this._authService.getAccessToken('User');
    if (!this._userId || !token) {
        console.error('User not authenticated, cannot connect to community chat.');
        return;
    }

    this._socket = io(`${environment.apiUrl}/community`, {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${token}`
      },
      autoConnect: true,
      reconnection: true
    });

    this._socket.on('connect', () => {
      console.log('Community _socket connected');
    });

    this._socket.on('disconnect', () => {
      console.warn('Community _socket disconnected');
    });

    this._socket.on('connect_error', (err) => {
      console.error('Community _socket connection error:', err);
    });

    this._socket.on('newMessage', (message: CommunityMessage) => {
        const currentMessages = this._messageSubject.getValue();
        this._messageSubject.next([...currentMessages, message]);
    });
  }

  joinCommunity(communityId: string): void {
    this._socket?.emit('joinCommunity', communityId);
  }

  leaveCommunity(communityId: string): void {
    if (this._socket) {
      this._socket.emit('leaveCommunity', communityId);
    }
  }

  sendMessage(communityId: string, content: string): void {
    if (!this._socket) {
      console.error('Socket is not connected.');
      return;
    }
    if (!this._userId) {
      console.error('Cannot send message, user ID is not available.');
      return;
    }
    this._socket.emit('sendMessage', { communityId, content });
  }

  getCommunities(): Observable<Community[]> {
    return this._http.get<Community[]>(`${environment.apiUrl}/editor/community`);
  }

  getCommunityById(id: string): Observable<Community> {
    return this._http.get<Community>(`${environment.apiUrl}/editor/community/${id}`);
  }

  createCommunity(name: string, description: string): Observable<Community> {
    return this._http.post<Community>(`${environment.apiUrl}/editor/community`, { name, description });
  }

  addMember(communityId: string, _userId: string): Observable<Community> {
    return this._http.post<Community>(`${environment.apiUrl}/editor/community/${communityId}/members`, { _userId });
  }

  getMessages(communityId: string): Observable<CommunityMessage[]> {
    return this._http.get<CommunityMessage[]>(`${environment.apiUrl}/editor/community/${communityId}/messages`);
  }

  loadMessages(communityId: string): void {
    this.getMessages(communityId).subscribe(messages => {
        this._messageSubject.next(messages);
    });
  }

  disconnect(): void {
    this._socket?.disconnect();
  }
}
