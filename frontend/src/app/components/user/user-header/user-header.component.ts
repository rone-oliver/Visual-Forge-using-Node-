import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { combineLatest, Subscription} from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { Notification, NotificationService } from '../../../services/notification/notification.service';
import { TemplatePortal } from '@angular/cdk/portal';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MediaProtectionDirective],
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss']
})
export class UserHeaderComponent implements OnInit, OnDestroy{
  isAuthenticated = false;
  userRole: string | null = null;
  private authSubscription!: Subscription;
  private notificationSubscription!: Subscription;
  // private themeSubscription!: Subscription;

  notifications: Notification[] = [];
  unreadNotificationsCount = 0;
  hasUnreadNotifications = false;
  private notificationsOverlayRef: OverlayRef | null = null;
  
  @ViewChild('notificationsOverlayTemplate') notificationsOverlayTemplate!: TemplateRef<any>;

  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private notificationService: NotificationService
  ){
    // this.themeService.isDarkTheme$.pipe(take(1)).subscribe(isDark => {
    //   document.documentElement.classList.toggle('dark', isDark);
    // });
    this.authService.userIsAuthenticated$.subscribe(isAuthenticated => {
      this.isAuthenticated = isAuthenticated;
    });
    this.authService.userRole$.subscribe(role=>{
      this.userRole = role;
    })
  };

  ngOnInit() {
    // Subscribe to authentication changes
    // this.authSubscription = combineLatest([
    //   this.authService.isAuthenticated$,
    //   this.authService.userRole$
    // ]).subscribe(([isAuthenticated, getUserRole]) => {
    //   this.isAuthenticated = isAuthenticated;
    //   this.userRole = getUserRole;
    //   // this.updateHeaderUI();
    // });
    // console.log(this.userRole);

    // this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
    //   document.documentElement.classList.toggle('dark', isDark);
    // });
    
    // Only initialize notifications once based on authentication state
    this.authSubscription = this.authService.userIsAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated && !this.notificationSubscription) {
        // Only initialize if not already initialized
        this.initializeNotifications();
      } else if (!isAuthenticated) {
        this.clearNotifications();
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    this.closeNotificationsOverlay();
    // if (this.themeSubscription) {
    //   this.themeSubscription.unsubscribe();
    // }
  }

  logout() {
    this.authService.logout('User').subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
        console.log('Logout successful');
      },
      error: (error) => {
        console.error('Logout failed:', error);
      }
    });
  }

  // Notification Methods
  private initializeNotifications() {
    // First, explicitly fetch unread notifications via HTTP to ensure we have them immediately
    this.fetchNotifications();
    
    // Listen for socket reconnection events to refresh notifications
    this.notificationService.onSocketReconnected().subscribe(() => {
      console.log('Socket reconnected, refreshing notifications');
      this.fetchNotifications();
    });
    
    // Set up WebSocket listeners for real-time updates
    this.notificationService.onInitialNotifications().subscribe(notifications => {
      const existingIds = new Set(this.notifications.map(n => n._id));
      const newNotifications = notifications.filter(n => !existingIds.has(n._id));
      
      if (newNotifications.length > 0) {
        this.notifications = [...newNotifications, ...this.notifications];
        this.updateUnreadCount();
      }
    });
    
    this.notificationSubscription = this.notificationService.onNewNotification().subscribe(notification => {
      const exists = this.notifications.some(n => n._id === notification._id);
      if (!exists) {
        this.notifications.unshift(notification);
        this.updateUnreadCount();
      }
    });
    
    this.notificationService.onNotificationStatusUpdate().subscribe(update => {
      const notification = this.notifications.find(n => n._id === update.notificationId);
      if (notification) {
        notification.unread = update.status === 'unread';
        this.updateUnreadCount();
      }
    });
  }
  
  private fetchNotifications() {
    this.notificationService.fetchUnreadNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.updateUnreadCount();
    });
  }
  
  private clearNotifications() {
    this.notifications = [];
    this.unreadNotificationsCount = 0;
    this.hasUnreadNotifications = false;
  }
  
  private updateUnreadCount() {
    this.unreadNotificationsCount = this.notifications.filter(n => n.unread).length;
    this.hasUnreadNotifications = this.unreadNotificationsCount > 0;
  }
  
  // Overlay Methods
  openNotificationsOverlay(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // If overlay is already open, close it
    if (this.notificationsOverlayRef) {
      this.closeNotificationsOverlay();
      return;
    }
    
    // Create the overlay
    const target = event.currentTarget as HTMLElement;
    
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(target)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8,
        }
      ]);
    
    this.notificationsOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.close()
    });
    
    // Attach the template to the overlay
    const portal = new TemplatePortal(this.notificationsOverlayTemplate, this.viewContainerRef);
    this.notificationsOverlayRef.attach(portal);
    
    // Close the overlay when clicking outside
    this.notificationsOverlayRef.backdropClick().subscribe(() => {
      this.closeNotificationsOverlay();
    });
  }
  
  closeNotificationsOverlay() {
    if (this.notificationsOverlayRef) {
      this.notificationsOverlayRef.dispose();
      this.notificationsOverlayRef = null;
    }
  }
  
  // Notification Action Handlers
  handleNotificationClick(notification: Notification) {
    // Mark as read
    if (notification.unread) {
      this.notificationService.markNotificationAsRead(notification._id);
      notification.unread = false;
      this.updateUnreadCount();
    }
    
    // Navigate based on notification type
    this.closeNotificationsOverlay();
    
    // Handle different notification types
    switch (notification.type) {
      case 'chat':
        if (notification.data?.chatId) {
          this.router.navigate(['/user/messaging'], { queryParams: { chatId: notification.data.chatId } });
        } else {
          this.router.navigate(['/user/messaging']);
        }
        break;
      case 'work':
        if (notification.data?.workId) {
          this.router.navigate(['/user/works', notification.data.workId]);
        } else {
          this.router.navigate(['/user/works']);
        }
        break;
      case 'payment':
        this.router.navigate(['/user/payments']);
        break;
      default:
        // General notifications or unknown types just close the overlay
        break;
    }
  }
  
  markAllNotificationsAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Update local notifications
        this.notifications.forEach(notification => notification.unread = false);
        this.unreadNotificationsCount = 0;
        this.hasUnreadNotifications = false;
      },
      error: (error) => console.error('Error marking all notifications as read:', error)
    });
  }

  markNotificationAsRead(notificationId: string) {
    this.notificationService.markAsReadHttp(notificationId).subscribe({
      next: (updatedNotification) => {
        // Update the specific notification in the local array
        const index = this.notifications.findIndex(n => n._id === notificationId);
        if (index !== -1) {
          this.notifications[index].unread = false;
          
          // Update unread count
          this.unreadNotificationsCount = Math.max(0, this.unreadNotificationsCount - 1);
          this.hasUnreadNotifications = this.unreadNotificationsCount > 0;
        }
      },
      error: (error) => console.error(`Error marking notification ${notificationId} as read:`, error)
    });
  }
  
  deleteNotification(notificationId: string) {
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        // Remove from local array
        this.notifications = this.notifications.filter(n => n._id !== notificationId);
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Failed to delete notification:', error);
      }
    });
  }
}
