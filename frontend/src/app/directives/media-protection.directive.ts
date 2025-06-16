import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appMediaProtection]',
  standalone: true
})
export class MediaProtectionDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Right-click prevented.');
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.el.nativeElement._touchStartTime = new Date().getTime();
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const touchDuration = new Date().getTime() - this.el.nativeElement._touchStartTime;
    if (touchDuration > 500) {
      event.preventDefault();
      event.stopPropagation();
      console.log('Long-press prevented (attempted).');
    }
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    event.preventDefault();
    console.log('Image drag prevented.');
  }

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, '-webkit-touch-callout', 'none');
    this.renderer.setStyle(this.el.nativeElement, '-webkit-user-select', 'none');
    this.renderer.setStyle(this.el.nativeElement, '-khtml-user-select', 'none');
    this.renderer.setStyle(this.el.nativeElement, '-moz-user-select', 'none');
    this.renderer.setStyle(this.el.nativeElement, '-ms-user-select', 'none');
    this.renderer.setStyle(this.el.nativeElement, 'user-select', 'none');
  }
}
