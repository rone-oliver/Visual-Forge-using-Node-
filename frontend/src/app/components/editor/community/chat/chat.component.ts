import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunityService } from '../../../../services/community/community-chat.service';
import { CommunityMessage, Community } from '../../../../interfaces/community.interface';
import { AuthService } from '../../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { ConfirmationDialogComponent, DialogType } from '../../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule, MatIconModule, MatButtonModule, DatePipe, MatDialogModule,
    MatMenuModule, MatTooltipModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: true,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  community: Community | null = null;
  messages: CommunityMessage[] = [];
  newMessageContent: string = '';
  userId: string | null = null;
  private messagesSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.communityService.getCommunityById(id).subscribe(community => {
          this.community = community;
        });
        this.communityService.joinCommunity(id);
        this.communityService.loadMessages(id);
        this.messagesSubscription = this.communityService.messages$.subscribe(messages => {
          this.messages = messages;
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.community?._id) {
      this.communityService.leaveCommunity(this.community._id);
    }
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (this.newMessageContent.trim() && this.community?._id) {
      this.communityService.sendMessage(this.community._id, this.newMessageContent.trim());
      this.newMessageContent = '';
    }
  }

  isMyMessage(message: CommunityMessage): boolean {
    return message.sender._id === this.userId;
  }

  getMemberNames(): string {
    if (!this.community || !this.community.members) {
      return '';
    }
    return this.community.members.map(member => member.fullname).join(', ');
  }

  reportCommunity(): void {
  }

  leaveCommunity(): void {
    if (!this.community) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Leave Community',
        message: `Are you sure you want to leave ${this.community.name}?`,
        type: DialogType.WARNING,
        confirmText: 'Leave',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.community?._id) {
        this.communityService.leaveCommunity(this.community._id);
        this.router.navigate(['/editor/community']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/editor/community']);
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
