import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { EditorPublicProfile } from '../../../interfaces/user.interface';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MediaProtectionDirective } from '../../../directives/media-protection.directive';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-editor-profile',
  standalone: true,
  imports: [MatButtonModule, CommonModule, MatTabsModule, MatIconModule, MatProgressSpinnerModule, MediaProtectionDirective],
  templateUrl: './editor-profile.component.html',
  styleUrls: ['./editor-profile.component.scss']
})
export class EditorProfileComponent implements OnInit {
  editorProfile$!: Observable<EditorPublicProfile>;
  isOwner: boolean = false;

  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private router: Router
  ) {
    this.matIconRegistry.addSvgIcon(
      'linkedin',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/linkedin.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'instagram',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/instagram.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'pinterest',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/pinterest.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'facebook',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/facebook.svg')
    );
  }

  ngOnInit(): void {
    const editorId = this.route.snapshot.paramMap.get('id');
    if (!editorId) {
      this.router.navigate(['/user']); 
      return;
    }
    
    this.editorProfile$ = this.refreshTrigger$.pipe(
      switchMap(() => this.userService.getEditorPublicProfile(editorId))
    );
  }

  follow(editorId: string): void {
    this.userService.followUser(editorId).pipe(
      tap(() => this.refreshTrigger$.next())
    ).subscribe();
  }

  unfollow(editorId: string): void {
    this.userService.unfollowUser(editorId).pipe(
      tap(() => this.refreshTrigger$.next())
    ).subscribe();
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
