import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { combineLatest, Subject, takeUntil, withLatestFrom } from 'rxjs';
import { TemplatePortal } from '@angular/cdk/portal';
import { ChatItem, ChatService, Message } from '../../../services/chat/chat.service';
import { AuthService } from '../../../services/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserSearchComponent } from '../../mat-dialogs/user-search/user-search.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

interface Recipient {
  id: string;
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, MatIconModule, FormsModule, MatMenuModule, MatTooltipModule, MatDialogModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  @ViewChild('attachmentMenu') attachmentMenuTemplate!: TemplateRef<any>;
  @ViewChild('emojiPickerTemplate') emojiPickerTemplate!: TemplateRef<any>;

  recipient: Recipient | null = null;
  messages: Message[] = [];
  newMessage = '';
  isUserListVisible = true;
  isChatAreaVisible = false;
  isTyping = false;
  isMobile = false;
  currentUserId: string | null = null;
  autoScrollEnabled = true;
  commonEmojis = ['😊', '😂', '❤️', '👍', '😍', '🎉', '🔥', '👋', '😎', '🙏', '💯', '⭐', '✅', '🤔', '😢', '🙌'];

  // Chat list related properties
  chatList: ChatItem[] = [];
  filteredChats: ChatItem[] = [];
  searchQuery = '';
  selectedChatId: string | null = null;
  smartReplySuggestions: string[] = [];

  private destroy$ = new Subject<void>();
  private smartReplySubscriptionDestroy$ = new Subject<void>();
  private attachmentOverlayRef: OverlayRef | null = null;
  private emojiPickerOverlayRef: OverlayRef | null = null;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private overlay: Overlay,
    private router: Router,
    private snackBar: MatSnackBar,
    private viewContainerRef: ViewContainerRef,
    private chatService: ChatService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.chatService.getLoggedInUserId();
    this.loadChatList();
    this.chatService.onNewMessage()
    .pipe(takeUntil(this.destroy$))
    .subscribe(message => {
      if (message.sender === this.selectedChatId || message.recipient === this.selectedChatId) {
        this.messages.push({
          ...message,
          isOutgoing: message.sender === this.currentUserId
        });
      }
      // Update chat list with new message
      this.updateChatListWithNewMessage(message);
    })

    this.chatService.onMessageStatusUpdate()
    .pipe(takeUntil(this.destroy$))
    .subscribe(update => {
      this.updateMessageStatus(update.messageId, update.status as 'delivered' | 'read');
    });

    // Monitor screen size changes
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      this.isMobile = result.matches;
    });
    
    this.chatService.onSmartRepliesResult()
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
        if (result.suggestions) {
          console.log('smart reply suggestions', result.suggestions);
          this.smartReplySuggestions = result.suggestions;
        } else if (result.error) {
          console.error('Smart reply error:', result.error);
          this.smartReplySuggestions = [];
        }
    });
  }

  updateChatListWithNewMessage(message: Message): void {
    // Find if we already have a chat with this user
    const otherUserId = message.sender === this.currentUserId ? message.recipient : message.sender;
    const existingChatIndex = this.chatList.findIndex(chat => chat._id === otherUserId);

    const isSelectedChat = this.selectedChatId === otherUserId;

    if (existingChatIndex !== -1) {
      // Update existing chat
      this.chatList[existingChatIndex] = {
        ...this.chatList[existingChatIndex],
        lastMessage: message.content,
        lastMessageTime: message.timestamp || new Date(),
        unreadCount: (message.sender !== this.currentUserId && !isSelectedChat) ?
          (this.chatList[existingChatIndex].unreadCount || 0) + 1 :
          this.chatList[existingChatIndex].unreadCount
      };
    } else {
      // // Create new chat entry
      this.chatService.getUserInfo(otherUserId).subscribe(user => {
        const newChat: ChatItem = {
          _id: otherUserId,
          username: user.username,
          avatarUrl: user.profileImage !== null ? user.profileImage : '',
          isOnline: user.isOnline || false,
          lastMessage: message.content,
          lastMessageTime: message.timestamp || new Date(),
          unreadCount: (message.sender !== this.currentUserId && !isSelectedChat) ? 1 : 0
        };
        this.chatList.unshift(newChat);
        this.filteredChats = [...this.chatList];
      });
    }

    // Update filtered chats if we updated an existing chat
    if (existingChatIndex !== -1) {
      this.filteredChats = [...this.chatList];
    }
  }

  ngAfterViewChecked(): void {
    if (this.autoScrollEnabled && this.messagesContainer) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.smartReplySubscriptionDestroy$.next();
    this.smartReplySubscriptionDestroy$.complete();
    this.closeAllOverlays();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.closeAllOverlays();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close overlays when clicking outside
    if (this.attachmentOverlayRef && !this.attachmentOverlayRef.overlayElement.contains(event.target as Node)) {
      this.attachmentOverlayRef.dispose();
      this.attachmentOverlayRef = null;
    }

    if (this.emojiPickerOverlayRef && !this.emojiPickerOverlayRef.overlayElement.contains(event.target as Node)) {
      this.emojiPickerOverlayRef.dispose();
      this.emojiPickerOverlayRef = null;
    }
  }

  // Chat list related methods
  loadChatList(): void {
    console.log('inside loadChatList');
    this.chatService.getChatList().subscribe(chats => {
      console.log('chats', chats);
      this.chatList = chats;
      this.filteredChats = [...this.chatList];
    });
  }

  filterChats(): void {
    if (!this.searchQuery.trim()) {
      this.filteredChats = [...this.chatList];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredChats = this.chatList.filter(chat =>
      chat.username.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }

  selectChat(chat: ChatItem): void {
    this.selectedChatId = chat._id;
    this.messages = [];
    this.smartReplySuggestions = []; // Clear previous suggestions

    // Unsubscribe from the previous chat's smart reply listener to prevent memory leaks
    this.smartReplySubscriptionDestroy$.next();

    this.loadMessages(chat._id);

    // Adjust layout for mobile
    this.isUserListVisible = false;
    this.isChatAreaVisible = true;

    const { outgoing$, incoming$ } = this.chatService.getMessageHistorySubjects(chat._id);

    // We only trigger smart replies when a new message is *received*.
    // We subscribe to the incoming$ stream and use withLatestFrom to get the latest outgoing messages without being triggered by them.
    incoming$.pipe(
        withLatestFrom(outgoing$),
        takeUntil(this.smartReplySubscriptionDestroy$),
        takeUntil(this.destroy$)
      )
      .subscribe(([incomingMessages, outgoingMessages]) => {
        // Only proceed if there are actually incoming messages to prevent firing on initial load with empty history.
        if (incomingMessages.length === 0) {
            return;
        }

        const conversationHistory = [...outgoingMessages, ...incomingMessages]
          .sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeA - timeB;
          });

        if (conversationHistory.length > 0) {
          this.chatService.getSmartReplies(conversationHistory);
        }
      });

    // Reset unread count when selecting a chat
    const chatIndex = this.chatList.findIndex(c => c._id === chat._id);
    if (chatIndex !== -1) {
      this.chatList[chatIndex].unreadCount = 0;
      this.filteredChats = [...this.chatList];
    }

    // Load recipient data
    this.recipient = {
      id: chat._id,
      username: chat.username,
      avatarUrl: chat.avatarUrl,
      isOnline: chat.isOnline,
    }
    // this.loadRecipientData(chat);

    // Load messages for this chat
  }

  getLastMessageTime(chat: ChatItem): string {
    const now = new Date();
    const messageDate = new Date(chat.lastMessageTime);

    // If the message is from today
    if (now.toDateString() === messageDate.toDateString()) {
      return this.formatTime(messageDate);
    }

    // If the message is from yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === messageDate.toDateString()) {
      return 'Yesterday';
    }

    // If the message is from this week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[messageDate.getDay()];
    }

    // Otherwise, return the date
    return `${messageDate.getDate()}/${messageDate.getMonth() + 1}/${messageDate.getFullYear().toString().substr(2)}`;
  }

  goBack(): void {
    if (this.isMobile) {
      this.selectedChatId = null;
    }
  }

  loadRecipientData(chat: ChatItem): void {
    if (chat) {
      this.recipient = {
        id: chat._id,
        username: chat.username,
        avatarUrl: chat.avatarUrl,
        isOnline: chat.isOnline
      };
      return;
    }
  }

  loadMessages(chatId: string): void {
    this.chatService.getMessagesBetweenUsers(chatId)
      .subscribe(messages => {
        this.messages = messages.map(message => ({
          ...message,
          isOutgoing: message.sender === this.currentUserId
        }));
        this.chatService.populateHistoryBuffers(messages, chatId);
      });
  }

  sendMessage(message?: string): void {
    const messageContent = message || this.newMessage.trim();
    
    if (!messageContent || !this.selectedChatId || !this.currentUserId || !this.recipient) return;

    this.chatService.sendMessage(this.recipient.id, messageContent);
    this.smartReplySuggestions = [];
    
    // Update the last message in chat list
    const chatIndex = this.chatList.findIndex(c => c._id === this.selectedChatId);
    if (chatIndex !== -1) {
      this.chatList[chatIndex].lastMessage = messageContent;
      this.chatList[chatIndex].lastMessageTime = new Date();
      this.filteredChats = [...this.chatList];
    }

    // Only clear the input field if we're using the input value (not a passed message)
    if (!message) {
      this.newMessage = '';
    }
    
    this.autoScrollEnabled = true;

    // Auto resize the input
    setTimeout(() => {
      this.resizeTextarea();
    });
  }

  sendSmartReply(reply: string): void {
    this.sendMessage(reply);
    this.smartReplySuggestions = [];
  }

  updateMessageStatus(messageId: string, status: 'delivered' | 'read'): void {
    const messageIndex = this.messages.findIndex(m => m._id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].status = status;
    }
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getMessageTime(message: Message): string {
    if (!message.createdAt) return '';
    const messageDate = message.createdAt instanceof Date 
    ? message.createdAt 
    : new Date(message.createdAt);
    
    return this.formatTime(messageDate);
  }

  formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  getMessageDateGroup(message: Message): string {
    const now = new Date();
    if (!message.createdAt) return '';
    const messageDate = new Date(message.createdAt);

    if (now.toDateString() === messageDate.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === messageDate.toDateString()) {
      return 'Yesterday';
    }

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (messageDate > oneWeekAgo) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[messageDate.getDay()];
    }

    return messageDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  shouldShowDateSeparator(prevMessage: Message, currMessage: Message): boolean {
    if (!prevMessage.createdAt || !currMessage.createdAt) return false;
    const prevDate = new Date(prevMessage.createdAt);
    const currDate = new Date(currMessage.createdAt);

    return prevDate.toDateString() !== currDate.toDateString();
  }

  trackByMessageId(index: number, message: Message): string {
    if (!message._id) return '';
    return message._id;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInput(): void {
    this.resizeTextarea();
  }

  resizeTextarea(): void {
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight > 120 ? 120 : textarea.scrollHeight) + 'px';
  }

  openAttachmentMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.attachmentOverlayRef) {
      this.attachmentOverlayRef.dispose();
      this.attachmentOverlayRef = null;
      return;
    }

    const target = event.currentTarget as HTMLElement;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(target)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        }
      ]);

    this.attachmentOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
    });

    const portal = new TemplatePortal(this.attachmentMenuTemplate, this.viewContainerRef);
    this.attachmentOverlayRef.attach(portal);
  }

  openEmojiPicker(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.emojiPickerOverlayRef) {
      this.emojiPickerOverlayRef.dispose();
      this.emojiPickerOverlayRef = null;
      return;
    }

    const target = event.currentTarget as HTMLElement;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(target)
      .withPositions([
        {
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetY: -8,
        }
      ]);

    this.emojiPickerOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
    });

    const portal = new TemplatePortal(this.emojiPickerTemplate, this.viewContainerRef);
    this.emojiPickerOverlayRef.attach(portal);
  }

  selectEmoji(emoji: string): void {
    this.newMessage += emoji;
    this.emojiPickerOverlayRef?.dispose();
    this.emojiPickerOverlayRef = null;

    // Focus the input after selecting an emoji
    setTimeout(() => {
      this.messageInput.nativeElement.focus();
    });
  }

  closeAllOverlays(): void {
    if (this.attachmentOverlayRef) {
      this.attachmentOverlayRef.dispose();
      this.attachmentOverlayRef = null;
    }

    if (this.emojiPickerOverlayRef) {
      this.emojiPickerOverlayRef.dispose();
      this.emojiPickerOverlayRef = null;
    }
  }

  attachPhoto(): void {
    this.showAttachmentNotImplemented('photo');
    this.closeAllOverlays();
  }

  attachFile(): void {
    this.showAttachmentNotImplemented('file');
    this.closeAllOverlays();
  }

  attachLocation(): void {
    this.showAttachmentNotImplemented('location');
    this.closeAllOverlays();
  }

  showAttachmentNotImplemented(type: string): void {
    this.snackBar.open(`Attaching ${type} is not implemented in this demo`, 'OK', {
      duration: 3000,
    });
  }

  initiateCall(): void {
    this.snackBar.open('Call feature is not implemented in this demo', 'OK', {
      duration: 3000,
    });
  }

  clearChat(): void {
    this.messages = [];
  }

  blockUser(): void {
    this.snackBar.open('User blocking is not implemented in this demo', 'OK', {
      duration: 3000,
    });
  }

  reportUser(): void {
    this.snackBar.open('User reporting is not implemented in this demo', 'OK', {
      duration: 3000,
    });
  }

  startNewChat(): void {
    const dialogRef = this.dialog.open(UserSearchComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: 'Start a New Chat',
        excludeUserIds: this.chatList.map(chat => chat._id)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'sendHi') {
          // User clicked the "Hi" button
          this.startChatWithUser(result.user._id, true);
        } else if (result._id) {
          // User clicked on a user item
          this.startChatWithUser(result._id);
        }
      }
    });
  }

  startChatWithUser(userId: string, sendHiMessage = false): void {
    const existingChat = this.chatList.find(chat => chat._id === userId);
    
    if (existingChat) {
      this.selectChat(existingChat);
      
      if (sendHiMessage) {
        this.sendMessage('Hi!');
      }
    } else {
      console.log('non existent chat');
      if(sendHiMessage){
        this.chatService.getUserInfo(userId).subscribe({
          next: (userInfo) => {
            this.chatService.createNewChat(userId).subscribe({
              next: (newChat) => {
                const completeChat: ChatItem = {
                  _id: userId,
                  username: userInfo.username,
                  avatarUrl: userInfo.profileImage ? userInfo.profileImage : '',
                  isOnline: userInfo.isOnline || false,
                  lastMessage: newChat.lastMessage ||'Hi!',
                  lastMessageTime: newChat.lastMessageTime || new Date(),
                  unreadCount: 0
                };
                
                this.chatList = [completeChat, ...this.chatList];
                this.selectChat(completeChat);
              },
              error: (error) => {
                console.error('Error creating new chat:', error);
                this.snackBar.open('Failed to create new chat', 'Close', {
                  duration: 3000,
                  panelClass: 'error-snackbar'
                });
              }
            });
          },
          error: (error) => {
            console.error('Error fetching user info:', error);
            this.snackBar.open('Failed to load user information', 'Close', {
              duration: 3000,
              panelClass: 'error-snackbar'
            });
          }
        });
      } else {
        this.chatService.getUserInfo(userId).subscribe({
          next: (userInfo) => {
            const newChatItem: ChatItem = {
              _id: userId,
              username: userInfo.username,
              avatarUrl: userInfo.profileImage ? userInfo.profileImage : '',
              isOnline: userInfo.isOnline || false,
              lastMessage: '',
              lastMessageTime: new Date(),
              unreadCount: 0
            };
            this.chatList = [newChatItem, ...this.chatList];
            this.selectChat(newChatItem);
          },
          error: (error) => {
            console.error('Error fetching user info:', error);
            this.snackBar.open('Failed to load user information', 'Close', {
              duration: 3000,
              panelClass: 'error-snackbar'
            });
          }
        });
      }
    }
  }
}
