import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../interfaces/user.interface';
import { UserService } from '../../../services/user/user.service';
import { Observable } from 'rxjs';
import { DatePipe } from '../../../pipes/date.pipe';
import { MatSnackBarConfig, MatSnackBar } from '@angular/material/snack-bar';
import { CloudinaryService } from '../../../services/cloudinary.service';

@Component({
  selector: 'app-profile',
  imports: [MatIconModule,CommonModule,DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit{
  user!:User;
  editorRequestStatus: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private cloudinaryService: CloudinaryService,
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
    this.getUserData();
    this.checkEditorRequestStatus();
  }

  private getUserData(){
    this.userService.getUserProfile().subscribe({
      next:(userData)=>{
        this.user = userData;
      },
      error:(error)=>{
        console.error('Error fetching user profile:', error);
      }
    })
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

  onFileSelected(event:any){
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      this.createImagePreview();
    }
  }

  private createImagePreview() {
    if(!this.selectedFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  cancelUpload() {
    this.selectedFile = null;
    this.previewUrl = null;
    setTimeout(() => {
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    });
  }

  uploadImage(){
    if(this.selectedFile){
      this.cloudinaryService.uploadProfileImage(this.selectedFile, this.user.username).subscribe((url:string)=>{
        this.userService.updateProfileImage(url).subscribe(()=>{
          this.showSuccess('Profile image updated successfully!');
          this.getUserData();
          this.cancelUpload();
        })
      })
    }
  }
}
