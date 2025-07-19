import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Report, ReportStatus, UpdateReportPayload } from '../../../interfaces/report.interface';
import { ReportService } from '../../../services/admin/report.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableComponent } from '../../shared/table/table.component';
import { MatDialog } from '@angular/material/dialog';
import { ReportsResolutionComponent } from '../../mat-dialogs/reports-resolution/reports-resolution.component';
import { ConfirmationDialogComponent, ConfirmationDialogData, DialogType } from '../../mat-dialogs/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-reported-users',
  imports: [
    TableComponent,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: './reported-users.component.html',
  styleUrls: ['./reported-users.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ReportedUsersComponent implements OnInit {
  reports: Report[] = [];
  isLoading = true;
  protected readonly ReportStatus = ReportStatus;

  tableColumns: TableColumn[] = [
    { key: 'reporterId.username', header: 'Reporter' },
    { key: 'reportedUserId.username', header: 'Reported User' },
    { key: 'reason', header: 'Reason' },
    { key: 'createdAt', header: 'Date', type: 'date' },
    { key: 'status', header: 'Status' },
    {
      key: 'actions',
      header: 'Actions',
      type: 'actions',
    },
  ];

  constructor(
    private readonly reportService: ReportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadPendingReports();
  }

  loadPendingReports(): void {
    this.isLoading = true;
    this.reportService.getPendingReports().subscribe({
      next: (reports) => {
        this.reports = reports.map(report => ({ ...report, canResolve: report.status !== ReportStatus.RESOLVED }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showSnackbar('Failed to load reports.', 'error');
      },
    });
  }

  onTableAction(event: { action: string; item: Report }): void {
    switch (event.action) {
      case 'review':
        this.updateReport(event.item, ReportStatus.REVIEWED);
        break;
      case 'resolve':
        this.openResolutionDialog(event.item);
        break;
      case 'block':
        this.blockUser(event.item.reportedUserId._id);
        break;
    }
  }

  openResolutionDialog(report: Report): void {
    const dialogRef = this.dialog.open(ReportsResolutionComponent, {
      width: '450px',
      data: { report },
      panelClass:['profile-edit-dialog']
    });

    dialogRef.afterClosed().subscribe((resolutionText: string) => {
      if (resolutionText) {
        this.updateReport(report, ReportStatus.RESOLVED,resolutionText);
      }
    });
  }

  updateReport(report: Report, status: ReportStatus, resolutionText?:string): void {
    const payload: UpdateReportPayload = { status };
    if (status === ReportStatus.RESOLVED) {
      payload.resolution = resolutionText;
    }

    this.reportService.updateReport(report._id, payload).subscribe({
      next: () => {
        this.showSnackbar(`Report status updated to ${status.toLowerCase()}.`);
        this.loadPendingReports(); // Refresh the list
      },
      error: (err) => {
        this.showSnackbar('Failed to update report.', 'error');
      },
    });
  }

  blockUser(userId: string): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Confirm Block User',
      message: 'Are you sure you want to block this user? This action is permanent.',
      confirmText: 'Block',
      cancelText: 'Cancel',
      type: DialogType.DANGER,
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reportService.blockUser(userId).subscribe({
          next: () => {
            this.showSnackbar('User has been blocked successfully.');
            this.loadPendingReports(); // Refresh data to show updated status
          },
          error: () => this.showSnackbar('Failed to block the user.', 'error'),
        });
      }
    });
  }

  private showSnackbar(message: string, panelClass = 'custom-snackbar'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['custom-snackbar', panelClass],
    });
  }
}
