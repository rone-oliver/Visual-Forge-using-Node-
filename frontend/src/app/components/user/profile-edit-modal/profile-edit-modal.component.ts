import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Language } from '../../../interfaces/user.interface';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { EditorService } from '../../../services/editor/editor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-profile-edit-modal',
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
],
  templateUrl: './profile-edit-modal.component.html',
  styleUrls: ['./profile-edit-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileEditModalComponent implements OnInit, AfterViewInit {
  editUser: any;
  languages = [Language.ENGLISH, Language.SPANISH, Language.FRENCH, Language.GERMAN, Language.HINDI];
  sharedTutorials: string[] = [];
  newTutorialUrl = '';

  @ViewChild('fullname', { read: ElementRef }) fullnameInputRef!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<ProfileEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private editorService: EditorService,
  ) {
    this.editUser = { ...data.user };
    this.sharedTutorials = [...(data.user.editorDetails?.sharedTutorials || [])];
  }

  ngOnInit() {
    // Make the dialog scrollable and set max-height
    this.dialogRef.updateSize('600px', '90vh');
  }

  ngAfterViewInit(): void {
    if(this.fullnameInputRef){
      this.fullnameInputRef.nativeElement.focus();
    }
  }

  addTutorial(): void {
    if (!this.newTutorialUrl || !this.isValidHttpUrl(this.newTutorialUrl)) {
      this.snackBar.open('Please enter a valid URL.', 'Close', { duration: 3000 });
      return;
    }

    this.editorService.addTutorial(this.newTutorialUrl).subscribe({
      next: (response) => {
        this.sharedTutorials.push(this.newTutorialUrl);
        this.newTutorialUrl = '';
        this.snackBar.open('Tutorial added successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Failed to add tutorial.', 'Close', { duration: 3000 });
      }
    });
  }

  removeTutorial(urlToRemove: string): void {
    this.editorService.removeTutorial(urlToRemove).subscribe({
      next: () => {
        this.sharedTutorials = this.sharedTutorials.filter(url => url !== urlToRemove);
        this.snackBar.open('Tutorial removed successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Failed to remove tutorial.', 'Close', { duration: 3000 });
      }
    });
  }

  private isValidHttpUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  hasChanges(): boolean {
    return Object.keys(this.editUser).some(key => {
      const originalValue = this.data.user[key];
      const editedValue = this.editUser[key];

      if ((originalValue === null || originalValue === undefined || originalValue === '') &&
        (editedValue === null || editedValue === undefined || editedValue === '')) {
        return false;
      }

      return originalValue !== editedValue;
    });
  }

  save() {
    const changedFields = this.getChangedFields();
    console.log('changed fields:', changedFields);
    this.dialogRef.close(changedFields);
  }

  getChangedFields() {
    const changed: any = {};
    const fields = ['fullname', 'username', 'mobileNumber', 'language', 'gender', 'about'];
    fields.forEach(field => {
      let original = this.data.user[field];
      let edited = this.editUser[field];

      if (typeof original === 'string') original = original.trim();
      if (typeof edited === 'string') edited = edited.trim();
      if (
        (original === null || original === undefined || original === '') &&
        (edited === null || edited === undefined || edited === '')
      ) {
        return;
      }
      if (original !== edited) {
        changed[field] = edited;
      }
    });
    return changed;
  }
}