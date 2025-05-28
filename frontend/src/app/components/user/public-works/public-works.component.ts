import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { EditorService } from '../../../services/editor/editor.service';
import { Works } from '../../../interfaces/completed-word.interface';
import { User } from '../../../interfaces/user.interface';
import { Editor } from '../../../interfaces/editor.interface';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorksCardComponent } from '../works-card/works-card.component';

@Component({
  selector: 'app-public-works',
  imports: [WorksCardComponent, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './public-works.component.html',
  styleUrl: './public-works.component.scss',
  animations: [
    trigger('staggerFadeIn', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class PublicWorksComponent implements OnInit {
  works: Works[] = [];
  usersMap: Map<string, User> = new Map();
  editorsMap: Map<string, Editor> = new Map();
  isLoading = false;
  error: string | null = null;

  Math = Math;
  
  // Search and filter
  searchTerm = '';
  filterRating: number | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;

  protected searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();

  get filteredWorks(): Works[] {
    return this.works;
  }
  
  constructor(
    private userService: UserService,
  ) {}
  
  ngOnInit(): void {
    this.searchTerms.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadWorks();
    });

    this.loadWorks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadWorks(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getPublicWorks(
      this.currentPage,
      this.itemsPerPage,
      this.filterRating,
      this.searchTerm
    )
      .pipe(
        switchMap(response => {
          this.works = response.works;
          this.totalItems = response.total;
          
          // Collect unique editor and user IDs
          const editorIds = [...new Set(this.works.map(work => work.editorId.toString()))];
          const userIds = [...new Set(this.works
            .filter(work => work.userId)
            .map(work => work.userId.toString()))];
          
          // Fetch editors and users data
          const editorRequests = editorIds.map(id => 
            this.userService.getEditor(id).pipe(
              map(editor => ({ id, editor })),
              catchError(() => of({ id, editor: null }))
            )
          );
          
          const userRequests = userIds.map(id => 
            this.userService.getUser(id).pipe(
              map(user => ({ id, user })),
              catchError(() => of({ id, user: null }))
            )
          );
          
          return forkJoin({
            editors: editorRequests.length ? forkJoin(editorRequests) : of([]),
            users: userRequests.length ? forkJoin(userRequests) : of([])
          });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: ({ editors, users }) => {
          // Process editors
          this.editorsMap.clear();
          editors.forEach(({ id, editor }) => {
            if (editor) {
              this.editorsMap.set(id, editor);
            }
          });
          
          // Process users
          this.usersMap.clear();
          users.forEach(({ id, user }) => {
            if (user) {
              this.usersMap.set(id, user);
            }
          });
        },
        error: (err) => {
          console.error('Error loading works', err);
          this.error = 'Failed to load works. Please try again later.';
        }
      });
  }
  
  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerms.next(term);
  }
  
  setRatingFilter(rating: number | null): void {
    this.filterRating = rating;
    this.currentPage = 1;
    this.loadWorks();
  }
  
  changePage(page: number): void {
    this.currentPage = page;
    this.loadWorks();
  }
  
  getEditor(editorId: any): Editor {
    if (!editorId) return {} as Editor;
    return this.editorsMap.get(editorId.toString()) as Editor;
  }
  
  getUser(userId: any): User {
    if (!userId) return {} as User;
    return this.usersMap.get(userId.toString()) as User;
  }
  
  trackByWorkId(work: Works): string {
    return work._id.toString();
  }
}
