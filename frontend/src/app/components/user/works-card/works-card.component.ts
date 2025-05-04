import { Component, ElementRef, Input, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Works } from '../../../interfaces/completed-word.interface';
import { User } from '../../../interfaces/user.interface';
import { Editor } from '../../../interfaces/editor.interface';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AudioVisualizerComponent } from '../../shared/audio-visualizer/audio-visualizer.component';

@Component({
  selector: 'app-works-card',
  standalone: true,
  imports: [MatIconModule, CommonModule, AudioVisualizerComponent],
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
export class WorksCardComponent implements OnInit, AfterViewInit {
  @Input() work!: Works;
  @Input() user!: User;
  @Input() editor!: Editor;

  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;

  cardState = 'default';
  filePreviewState = 'collapsed';
  activeFileIndex = 0;
  
  // Track if current file is audio
  isAudioFile = false;
  audioElementReady = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Works card initialized:', this.work);
    
    // Check if the initial active file is audio
    if (this.work?.finalFiles?.length > 0) {
      this.updateFileTypeState();
    }
  }
  
  ngAfterViewInit(): void {
    // Only log and set audio element if we have an audio file
    if (this.isAudioFile) {
      console.log('Audio element reference:', this.audioPlayerRef?.nativeElement);
      console.log('Audio source URL:', this.work.finalFiles[this.activeFileIndex].url);
      console.log('Audio MIME type:', this.work.finalFiles[this.activeFileIndex].mimeType);
      
      // Wait for next cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.audioElementReady = this.audioPlayerRef?.nativeElement ? true : false;
        console.log('Audio element ready:', this.audioElementReady);
        this.cdr.detectChanges();
      });
    }
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
    
    // Reset audio state
    this.audioElementReady = false;
    
    // Update file type and check for audio
    this.updateFileTypeState();
    
    // If it's an audio file, we need to wait for the audio element to be created
    if (this.isAudioFile) {
      // Need to wait for the DOM to update with the new audio element
      setTimeout(() => {
        this.audioElementReady = this.audioPlayerRef?.nativeElement ? true : false;
        this.cdr.detectChanges();
      });
    }
  }
  
  updateFileTypeState() {
    // Check if current file is audio
    if (this.work?.finalFiles?.length > this.activeFileIndex) {
      const currentMimeType = this.work.finalFiles[this.activeFileIndex].mimeType;
      this.isAudioFile = this.getFileType(currentMimeType) === 'audio';
    }
  }

  getRatingStars(): number[] {
    return Array(5).fill(0).map((_, i) => i < (this.work.rating || 0) ? 1 : 0);
  }
}