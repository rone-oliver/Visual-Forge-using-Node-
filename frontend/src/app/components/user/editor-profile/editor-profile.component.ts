import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { EditorPublicProfile } from '../../../interfaces/user.interface';
import { Observable } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-editor-profile',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './editor-profile.component.html',
  styleUrls: ['./editor-profile.component.scss']
})
export class EditorProfileComponent implements OnInit {
  editorProfile$!: Observable<EditorPublicProfile>;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
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
    if (editorId) {
      this.editorProfile$ = this.userService.getEditorPublicProfile(editorId);
    }
  }
}
