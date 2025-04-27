import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Language } from '../../../interfaces/user.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-edit-modal',
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatSelectModule,
    CommonModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './profile-edit-modal.component.html',
  styleUrls: ['./profile-edit-modal.component.scss'],
  // This is important to allow our deep styles to affect Angular Material components
  encapsulation: ViewEncapsulation.None
})
export class ProfileEditModalComponent implements OnInit {
  editUser: any;
  languages = [Language.ENGLISH, Language.SPANISH, Language.FRENCH, Language.GERMAN, Language.HINDI];

  constructor(
    public dialogRef: MatDialogRef<ProfileEditModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.editUser = { ...data.user };
  }

  ngOnInit() {
    // Make the dialog scrollable and set max-height
    this.dialogRef.updateSize('600px', '90vh');
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