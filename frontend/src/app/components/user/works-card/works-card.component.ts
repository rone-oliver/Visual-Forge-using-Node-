import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Works } from '../../../interfaces/completed-word.interface';
import { User } from '../../../interfaces/user.interface';
import { Editor } from '../../../interfaces/editor.interface';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-works-card',
  imports: [MatIconModule, CommonModule],
  templateUrl: './works-card.component.html',
  styleUrl: './works-card.component.scss',
  animations: [
    trigger('cardHover', [
      state('default', style({
        transform: 'translateY(0)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      })),
      state('hovered', style({
        transform: 'translateY(-8px)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      })),
      transition('default => hovered', [
        animate('200ms ease-out')
      ]),
      transition('hovered => default', [
        animate('150ms ease-in')
      ])
    ]),
    trigger('filePreviewExpand', [
      state('collapsed', style({
        height: '0px',
        opacity: 0
      })),
      state('expanded', style({
        height: '*',
        opacity: 1
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class WorksCardComponent implements OnInit {
  @Input() work!: Works;
  @Input() user!: User;
  @Input() editor!: Editor;

  cardState = 'default';
  filePreviewState = 'collapsed';
  activeFileIndex = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('public works:', this.work);
  }

  onCardMouseEnter() {
    this.cardState = 'hovered';
  }

  onCardMouseLeave() {
    this.cardState = 'default';
  }

  toggleFilePreview() {
    this.filePreviewState = this.filePreviewState === 'collapsed' ? 'expanded' : 'collapsed';
  }

  navigateToEditorProfile() {
    if (this.editor && this.editor._id) {
      this.router.navigate(['/editor', this.editor._id]);
    }
  }

  navigateToUserProfile() {
    if (this.user && this.user._id) {
      this.router.navigate(['/user', this.user._id]);
    }
  }

  getFileType(mimeType: string): string {
    if (!mimeType) return 'file';
    const type = mimeType.split('/')[0].toLowerCase();
    const subtype = mimeType.split('/')[1]?.toLowerCase();

    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      case 'application':
        if (subtype === 'pdf') return 'pdf';
        if (subtype === 'vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          subtype === 'msword') return 'document';
        return 'file';
      default:
        return 'file';
    }
  }

  getFileIcon(mimeType: string): string {
    const type = this.getFileType(mimeType);
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'audio': return 'audiotrack';
      case 'pdf': return 'picture_as_pdf';
      case 'document': return 'description';
      default: return 'insert_drive_file';
    }
  }

  changeActiveFile(index: number) {
    this.activeFileIndex = index;
  }

  getRatingStars(): number[] {
    return Array(5).fill(0).map((_, i) => i < (this.work.rating || 0) ? 1 : 0);
  }

  // getFileName(filePath: string): string {
  //   return filePath.split('/').pop() || filePath;
  // }
}
