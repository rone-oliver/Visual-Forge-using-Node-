import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PublicEditorProfile, PaginatedPublicEditors, GetPublicEditorsDto } from '../../../interfaces/user.interface';
import { ProfileCardComponent } from '../../shared/profile-card/profile-card.component';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-editor-listing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    ProfileCardComponent,
    MatIconModule
  ],
  templateUrl: './editor-listing.component.html',
  styleUrls: ['./editor-listing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorListingComponent implements OnInit {
  filterForm: FormGroup;
  editors: PublicEditorProfile[] = [];
  totalEditors = 0;
  pageSize = 12;
  currentPage = 0;

  loading = new BehaviorSubject<boolean>(true);

  categories = [
    { value: 'video', viewValue: 'Video Editing' },
    { value: 'audio', viewValue: 'Audio Editing' },
    { value: 'image', viewValue: 'Image Editing' },
  ];

  ratings = [
    { value: 5, viewValue: '5 Stars' },
    { value: 4, viewValue: '4 Stars & Up' },
    { value: 3, viewValue: '3 Stars & Up' },
    { value: 2, viewValue: '2 Stars & Up' },
    { value: 1, viewValue: '1 Star & Up' },
  ];

  constructor(private userService: UserService, private router: Router) {
    this.filterForm = new FormGroup({
      search: new FormControl(''),
      category: new FormControl(''),
      rating: new FormControl(null),
    });
  }

  ngOnInit(): void {
    this.loadEditors();
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadEditors();
    });
  }

  loadEditors(): void {
    this.loading.next(true);
    const filters = this.filterForm.value;
    const params: GetPublicEditorsDto = {
      ...filters,
      page: this.currentPage + 1,
      limit: this.pageSize,
    };

    this.userService.getPublicEditors(params).subscribe({
      next: (response) => {
        this.editors = response.data;
        this.totalEditors = response.total;
        this.loading.next(false);
      },
      error: () => {
        this.editors = [];
        this.totalEditors = 0;
        this.loading.next(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEditors();
  }

  navigateToProfile(editorId: string): void {
    this.router.navigate(['/user/editors/profile', editorId]);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      category: '',
      rating: null,
    });
  }
}
