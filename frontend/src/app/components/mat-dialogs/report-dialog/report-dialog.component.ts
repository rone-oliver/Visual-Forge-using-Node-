import { Component, Inject, OnInit } from '@angular/core'; // <-- Add OnInit
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select'; // <-- Import MatSelectModule
import { MatInputModule } from '@angular/material/input'; // <-- Import MatInputModule
import { MatButtonModule } from '@angular/material/button'; // <-- Import MatButtonModule
import { CommonModule } from '@angular/common';

export enum ReportContext {
  CHAT = 'chat',
  QUOTATION = 'quotation'
}

export interface ReportDialogData {
  title: string;
  user: {
    username: string;
    profileImage?: string;
  };
  context: ReportContext;
  additionalContext?: string; // This might be used to pre-fill the additional context field
}

export interface ReportReason {
  value: string;
  label: string;
  context?: ReportContext[]; // Optional contexts where this reason is applicable
}

export interface ReportDialogResult {
  reason: string; // This will be the actual reason text, not just 'other'
  additionalContext: string;
  context: ReportContext;
}

@Component({
  selector: 'app-report-dialog',
  // Make sure all Material modules used in the template are imported here
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule, // For mat-form-field
    MatSelectModule,    // For mat-select
    MatOptionModule,    // For mat-option
    MatInputModule,     // For matInput (textarea)
    MatButtonModule,    // For mat-button, mat-raised-button
    ReactiveFormsModule // For formGroup
  ],
  standalone: true, // Assuming this is a standalone component
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.scss'
})
export class ReportDialogComponent implements OnInit { // <-- Implement OnInit
  reportForm!: FormGroup;
  reportReasons: ReportReason[] = [
    { value: 'harassment', label: 'Harassment or Bullying', context: [ReportContext.CHAT] },
    { value: 'hate_speech', label: 'Hate Speech', context: [ReportContext.CHAT] },
    { value: 'spam', label: 'Spam or Scam', context: [ReportContext.CHAT] },
    { value: 'nudity', label: 'Nudity or Sexual Content', context: [ReportContext.CHAT] },
    { value: 'violence', label: 'Violence or Threats', context: [ReportContext.CHAT] },
    { value: 'impersonation', label: 'Impersonation', context: [ReportContext.CHAT] },
    { value: 'illegal', label: 'Illegal Activity', context: [ReportContext.CHAT] },
    { value: 'privacy', label: 'Privacy Violation', context: [ReportContext.CHAT] },
    { value: 'self_harm', label: 'Self-Harm or Suicidal Content', context: [ReportContext.CHAT] },
    { value: 'work_quality', label: 'Poor Work Quality', context: [ReportContext.QUOTATION] },
    { value: 'deadline_missed', label: 'Deadline Missed', context: [ReportContext.QUOTATION] },
    { value: 'communication', label: 'Poor Communication', context: [ReportContext.QUOTATION] },
    { value: 'other', label: 'Other / Something Else' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportDialogData
  ) {}

  ngOnInit(): void { // <-- Implement ngOnInit
    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      otherReason: [''], // Will be conditionally validated
      additionalContext: [this.data.additionalContext || ''] // Pre-fill if provided
    });

    // Subscribe to reason changes for conditional validation
    this.reportForm.get('reason')?.valueChanges.subscribe(reason => {
      const otherReasonControl = this.reportForm.get('otherReason');
      if (reason === 'other') {
        otherReasonControl?.setValidators(Validators.required);
      } else {
        otherReasonControl?.clearValidators();
      }
      otherReasonControl?.updateValueAndValidity(); // Crucial to update validation status
    });
  }

  get filteredReasons(): ReportReason[] {
    return this.reportReasons.filter(reason =>
      !reason.context || reason.context.includes(this.data.context) || reason.value === 'other'
    );
  }

  get showOtherReason(): boolean {
    return this.reportForm.get('reason')?.value === 'other';
  }

  onSubmit(): void {
    // Mark all controls as touched to trigger validation messages
    this.reportForm.markAllAsTouched();
    if (this.reportForm.valid) {
      const result: ReportDialogResult = {
        reason: this.reportForm.get('reason')?.value === 'other'
          ? this.reportForm.get('otherReason')?.value // Use the text typed in 'otherReason'
          : this.reportForm.get('reason')?.value,    // Use the selected reason value
        additionalContext: this.reportForm.get('additionalContext')?.value,
        context: this.data.context
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}