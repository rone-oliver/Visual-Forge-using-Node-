import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommunityService } from '../../../../services/community/community-chat.service';
import { CreateCommunityComponent } from '../../../mat-dialogs/create-community/create-community.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmationDialogComponent, DialogType } from '../../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';
import { Community } from '../../../../interfaces/community.interface';

@Component({
  selector: 'app-communities',
  imports: [MatIconModule,CommonModule,MatButtonModule,MatCardModule,MatProgressSpinnerModule],
  templateUrl: './communities.component.html',
  styleUrl: './communities.component.scss'
})
export class CommunitiesComponent implements OnInit {
  communities: Community[] = [];
  isLoading = true;
  private userId: string | null = null;

  constructor(
    private communityService: CommunityService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId() ?? null;
    this.loadCommunities();
  }

  loadCommunities() {
    this.isLoading = true;
    this.communityService.getCommunities().subscribe(
      (data) => {
        this.communities = data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching communities:', error);
        this.isLoading = false;
      }
    );
  }

  onCommunityClick(community: Community): void {
    const isMember = community.members.some(member => member._id === this.userId);

    if (isMember) {
      this.router.navigate(['/editor/community', community._id]);
    } else {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '350px',
        data: {
          title: 'Join Community',
          message: `Do you want to join the "${community.name}" community?`,
          type: DialogType.INFO,
          confirmText: 'Join',
          cancelText: 'Cancel'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && this.userId) {
          this.communityService.addMember(community._id, this.userId).subscribe(() => {
            this.router.navigate(['/editor/community', community._id]);
          });
        }
      });
    }
  }

  openCreateCommunityDialog(): void {
    const dialogRef = this.dialog.open(CreateCommunityComponent, {
      width: '400px',
      panelClass: 'profile-edit-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCommunities();
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
