import { inject, Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, Observable, of, Subject } from 'rxjs';
import { JwtPayload } from '../auth.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from '../logger.service';

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

interface ConversationSubjects {
  outgoing$: BehaviorSubject<Message[]>;
  incoming$: BehaviorSubject<Message[]>;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _userId: string | null;
  private _socket: Socket | null = null;
  private readonly _newMessage = new Subject<Message>();
  private readonly _messageStatusUpdated = new Subject<{ messageId: string, status: string }>();
  private _conversationSubjects = new Map<string, ConversationSubjects>();

  // Services
  private readonly _authService = inject(AuthService);
  private readonly _http = inject(HttpClient);
  private readonly _logger = inject(LoggerService);

  constructor() {
    this._userId = this.getLoggedInUserId();
    if (!this._userId) {
      this._logger.error('No user ID found');
      return;
    }
    this.initializeSocket();
    this.setupNewMessageListener();
  }

  private initializeSocket() {
    const token = this._authService.getAccessToken('User');
    if (!this._userId || !token) return;

    this._socket = io(`${environment.socketIoBaseUrl}/chat`, {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${token}`
      },
      autoConnect: true,
      reconnection: true
    });

    this._socket.on('connect', () => {
      this._logger.info('Socket connected');
    });

    this._socket.on('disconnect', () => {
      this._logger.warn('Socket disconnected, trying to reconnect...');
    });

    this._socket.on('connect_error', (err) => {
      this._logger.error('Socket connection error:', err);
    });
  }

  private extractJwtPayload(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      this._logger.error('JWT Decode error:', error);
      return null;
    }
  }

  getLoggedInUserId(): string | null {
    const token = this._authService.getAccessToken('User');
    if (token) {
      const payload = this.extractJwtPayload(token);
      return payload?.userId ?? null;
    }
    return null;
  }

  getChatList() {
    return this._http.get<ChatItem[]>(`${environment.apiUrl}/user/chats/list`);
  }

  createNewChat(_userId: string): Observable<ChatItem> {
    return this._http.post<ChatItem>(`${environment.apiUrl}/user/chats`, { recipientId: _userId })
      .pipe(
        catchError(error => {
          this._logger.error('Error creating new chat:', error);
          throw error;
        })
      );
  }

  getMessagesBetweenUsers(recipientId: string) {
    return this._http.get<Message[]>(`${environment.apiUrl}/user/chats/messages/${recipientId}`);
  }

  sendMessage(recipientId: string, content: string): void {
    const messageData = { recipientId, content };
    this._socket?.emit('message', messageData);

    const subjects = this._conversationSubjects.get(recipientId);
    if (subjects) {
      const optimisticMessage: Message = {
        sender: this._userId!,
        recipient: recipientId,
        content: content,
        status: 'sent',
        createdAt: new Date(),
      };
      const currentHistory = subjects.outgoing$.getValue();
      subjects.outgoing$.next([...currentHistory, optimisticMessage].slice(-5));
    }
  }

  onNewMessage(): Observable<Message> {
    return this._newMessage.asObservable();
  }

  onConnected(): Observable<any> {
    return new Observable(observer => {
      this._socket?.on('connected', (data) => observer.next(data));
      return () => this._socket?.off('connected');
    });
  }

  onMessageError(): Observable<any> {
    return new Observable(observer => {
      this._socket?.on('messageError', (err) => observer.next(err));
      return () => this._socket?.off('messageError');
    });
  }

  updateMessageStatus(messageId: string, status: 'delivered' | 'read'): void {
    this._socket?.emit('updateMessageStatus', { messageId, status });
  }

  onMessageStatusUpdate(): Observable<{ messageId: string, status: string }> {
    return this._messageStatusUpdated.asObservable();
  }

  getUserInfo(_userId: string) {
    return this._http.get<{
      username: string;
      profileImage?: string;
      isOnline?: boolean;
    }>(`${environment.apiUrl}/user/chats/${_userId}`).pipe(
      catchError(error => {
        this._logger.error('Error fetching user info:', error);
        return of({
          username: 'Unknown User',
          profileImage: null,
          isOnline: false
        });
      })
    );
  }

  getMessageHistorySubjects(recipientId: string): { outgoing$: Observable<Message[]>, incoming$: Observable<Message[]> } {
    if (!this._conversationSubjects.has(recipientId)) {
      this._conversationSubjects.set(recipientId, {
        outgoing$: new BehaviorSubject<Message[]>([]),
        incoming$: new BehaviorSubject<Message[]>([]),
      });
    }
    const subjects = this._conversationSubjects.get(recipientId)!;
    return {
      outgoing$: subjects.outgoing$.asObservable(),
      incoming$: subjects.incoming$.asObservable(),
    };
  }

  populateHistoryBuffers(messages: Message[], recipientId: string): void {
    const conversation = this._conversationSubjects.get(recipientId);
    if (!conversation) return;

    const outgoingMessages = messages.filter(m => m.sender === this._userId).slice(-5);
    const incomingMessages = messages.filter(m => m.sender !== this._userId).slice(-5);

    conversation.outgoing$.next(outgoingMessages);
    conversation.incoming$.next(incomingMessages);
  }

  getSmartReplies(messages: Message[]): void {
    this._logger.info('messages for suggestions:', messages);
    this._socket?.emit('getSmartReplies', { messages });
  }

  onSmartRepliesResult(): Observable<{ suggestions?: string[]; error?: string }> {
    return new Observable(observer => {
      this._socket?.on('smartRepliesResult', (result) => observer.next(result));
      return () => this._socket?.off('smartRepliesResult');
    });
  }

  private setupNewMessageListener(): void {
    this._socket?.on('_newMessage', (message: Message) => {
      this._newMessage.next(message);

      const recipientId = message.sender === this._userId ? message.recipient : message.sender;
      const conversation = this._conversationSubjects.get(recipientId);

      if (conversation) {
        if (message.sender === this._userId) {
          const currentHistory = conversation.outgoing$.getValue();
          conversation.outgoing$.next([...currentHistory, message].slice(-5));
        } else {
          const currentHistory = conversation.incoming$.getValue();
          conversation.incoming$.next([...currentHistory, message].slice(-5));
        }
      }
    });
  }

  disconnect(): void {
    this._socket?.disconnect();
  }

  reconnect(): void {
    if (!this._socket?.connected) {
      this.initializeSocket();
    }
  }
}
