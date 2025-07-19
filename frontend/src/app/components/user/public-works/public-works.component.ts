import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { EditorService } from '../../../services/editor/editor.service';
import { Works } from '../../../interfaces/completed-work.interface';
import { User } from '../../../interfaces/user.interface';
import { Editor } from '../../../interfaces/editor.interface';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
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
export class PublicWorksComponent implements OnInit, OnDestroy {
  works: Works[] = [];
  usersMap = new Map<string, User>();
  editorsMap = new Map<string, Editor>();
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
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.works = response.works;
          this.totalItems = response.total;
          
          // Process editors and users data if they're included in the response
          this.editorsMap.clear();
          this.usersMap.clear();
          
          this.works.forEach(work => {
            // If the backend returns populated editor and user objects
            // if (work.editorId && typeof work.editorId === 'object') {
            //   const editor = work.editorId as unknown as Editor;
            //   this.editorsMap.set(editor._id.toString(), editor);
            //   // Update the editorId to be just the ID string for consistency
            //   work.editorId = editor._id;
            // }
            
            // if (work.userId && typeof work.userId === 'object') {
            //   const user = work.userId as unknown as User;
            //   this.usersMap.set(user._id.toString(), user);
            //   // Update the userId to be just the ID string for consistency
            //   work.userId = user._id;
            // }
            if(work.editor && typeof work.editor === 'object'){
              this.editorsMap.set(work.editor._id.toString(), work.editor);
            }
            if(work.user && typeof work.user === 'object'){
              this.usersMap.set(work.user._id.toString(), work.user);
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
    console.log('search value', term);
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
