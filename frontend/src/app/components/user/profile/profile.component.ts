import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../interfaces/user.interface';
import { UserService } from '../../../services/user/user.service';
import { Observable } from 'rxjs';
import { DatePipe } from '../../../pipes/date.pipe';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  imports: [MatIconModule,CommonModule,DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  user$!:Observable<User>;
  editorRequestStatus: string | null = null;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
  ) { }

  showSuccess(message:string):void {
    const config: MatSnackBarConfig = {
      duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
    }
    this.snackBar.open(message, 'Close', config);
  }

  ngOnInit(): void {
    this.user$ = this.userService.getUserProfile();
    this.checkEditorRequestStatus();
  }

  private checkEditorRequestStatus(): void {
    this.userService.getEditorRequestStatus().subscribe({
      next: (status) => {
        this.editorRequestStatus = status;
      },
      error: (error) => {
        console.error('Error fetching editor request status:', error);
      }
    });
  }

  requestEditorStatus(): void {
    console.log('Editor status requested');
    this.userService.requestForEditor().subscribe({
      next:(response)=>{
        console.log('Editor request response:', response);
        this.showSuccess('Editor request sent successfully!');
        this.checkEditorRequestStatus();
      },
      error:(error)=>{
        console.error('Error requesting for becoming Editor: ', error);
      }
    })
  }

  hasSocialLinks(socialLinks: any): boolean {
    if (!socialLinks) return false;
    return Object.values(socialLinks).some(link => !!link);
  }
}
