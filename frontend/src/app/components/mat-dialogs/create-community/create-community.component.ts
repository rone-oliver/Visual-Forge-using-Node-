import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommunityService } from '../../../services/community/community-chat.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-community',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './create-community.component.html',
  styleUrls: ['./create-community.component.scss']
})
export class CreateCommunityComponent {
  createCommunityForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private communityService: CommunityService,
    public dialogRef: MatDialogRef<CreateCommunityComponent>
  ) {
    this.createCommunityForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  onCreate(): void {
    if (this.createCommunityForm.valid) {
      const { name, description } = this.createCommunityForm.value;
      this.communityService.createCommunity(name, description).subscribe(
        () => {
          this.dialogRef.close(true);
        },
        (error) => {
          console.error('Error creating community:', error);
        }
      );
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}