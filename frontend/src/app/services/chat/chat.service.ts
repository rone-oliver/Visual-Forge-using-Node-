import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, catchError, Observable, of, Subject } from 'rxjs';
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

interface ConversationSubjects {
  outgoing$: BehaviorSubject<Message[]>;
  incoming$: BehaviorSubject<Message[]>;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private userId: string | null;
  private socket: Socket | null = null;
  private newMessage = new Subject<Message>();
  private messageStatusUpdated = new Subject<{ messageId: string, status: string }>();
  private chatListUpdated = new Subject<void>();
  private conversationSubjects = new Map<string, ConversationSubjects>();

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
    this.setupNewMessageListener();
  }

  private initializeSocket() {
    const token = this.authService.getAccessToken('User');
    if (!this.userId || !token) return;

    this.socket = io(`${environment.apiUrl}/chat`, {
      transports: ['websocket'],
      auth: {
        token: `Bearer ${token}`
      },
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
    const messageData = { recipientId, content };
    this.socket?.emit('message', messageData);

    const subjects = this.conversationSubjects.get(recipientId);
    if (subjects) {
      const optimisticMessage: Message = {
        sender: this.userId!,
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
    return this.newMessage.asObservable();
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

  onMessageStatusUpdate(): Observable<{ messageId: string, status: string }> {
    return this.messageStatusUpdated.asObservable();
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

  getMessageHistorySubjects(recipientId: string): { outgoing$: Observable<Message[]>, incoming$: Observable<Message[]> } {
    if (!this.conversationSubjects.has(recipientId)) {
      this.conversationSubjects.set(recipientId, {
        outgoing$: new BehaviorSubject<Message[]>([]),
        incoming$: new BehaviorSubject<Message[]>([]),
      });
    }
    const subjects = this.conversationSubjects.get(recipientId)!;
    return {
      outgoing$: subjects.outgoing$.asObservable(),
      incoming$: subjects.incoming$.asObservable(),
    };
  }

  populateHistoryBuffers(messages: Message[], recipientId: string): void {
    const conversation = this.conversationSubjects.get(recipientId);
    if (!conversation) return;

    const outgoingMessages = messages.filter(m => m.sender === this.userId).slice(-5);
    const incomingMessages = messages.filter(m => m.sender !== this.userId).slice(-5);

    conversation.outgoing$.next(outgoingMessages);
    conversation.incoming$.next(incomingMessages);
  }

  getSmartReplies(messages: Message[]): void {
    console.log('messages for suggestions:', messages);
    this.socket?.emit('getSmartReplies', { messages });
  }

  onSmartRepliesResult(): Observable<{ suggestions?: string[]; error?: string }> {
    return new Observable(observer => {
      this.socket?.on('smartRepliesResult', (result) => observer.next(result));
      return () => this.socket?.off('smartRepliesResult');
    });
  }

  private setupNewMessageListener(): void {
    this.socket?.on('newMessage', (message: Message) => {
      this.newMessage.next(message);

      const recipientId = message.sender === this.userId ? message.recipient : message.sender;
      const conversation = this.conversationSubjects.get(recipientId);

      if (conversation) {
        if (message.sender === this.userId) {
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
    this.socket?.disconnect();
  }

  reconnect(): void {
    if (!this.socket?.connected) {
      this.initializeSocket();
    }
  }
}
