import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user/user.service';
import { EditorService } from '../../../services/editor/editor.service';
import { Works } from '../../../interfaces/completed-word.interface';
import { User } from '../../../interfaces/user.interface';
import { Editor } from '../../../interfaces/editor.interface';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorksCardComponent } from '../works-card/works-card.component';

@Component({
  selector: 'app-public-works',
  imports: [WorksCardComponent, CommonModule, MatIconModule, MatProgressSpinnerModule],
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
  filteredWorks: Works[] = [];
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
  
  constructor(
    private userService: UserService,
    private editorService: EditorService,
  ) {}
  
  ngOnInit(): void {
    this.loadWorks();
  }
  
  loadWorks(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getPublicWorks(this.currentPage, this.itemsPerPage)
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
          this.applyFilters();
        })
      )
      .subscribe({
        next: ({ editors, users }) => {
          // Create maps for quick lookups
          editors.forEach(item => {
            if (item.editor) {
              this.editorsMap.set(item.id, item.editor);
            }
          });
          
          users.forEach(item => {
            if (item.user) {
              this.usersMap.set(item.id, item.user);
            }
          });
        },
        error: (err) => {
          console.error('Error loading works', err);
          this.error = 'Failed to load works. Please try again later.';
        }
      });
  }
  
  applyFilters(): void {
    this.filteredWorks = this.works.filter(work => {
      // Filter by rating if selected
      if (this.filterRating !== null && work.rating !== this.filterRating) {
        return false;
      }
      
      // Filter by search term if provided
      if (this.searchTerm.trim()) {
        const search = this.searchTerm.toLowerCase();
        const editor = this.editorsMap.get(work.editorId.toString());
        const user = work.userId ? this.usersMap.get(work.userId.toString()) : null;
        
        const editorMatch = editor && editor.fullname.toLowerCase().includes(search);
        const userMatch = user && user.fullname.toLowerCase().includes(search);
        
        return editorMatch || userMatch;
      }
      
      return true;
    });
  }
  
  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }
  
  setRatingFilter(rating: number | null): void {
    this.filterRating = rating;
    this.applyFilters();
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
