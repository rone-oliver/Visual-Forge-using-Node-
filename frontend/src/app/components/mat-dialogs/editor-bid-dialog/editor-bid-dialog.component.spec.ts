import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorBidDialogComponent } from './editor-bid-dialog.component';

describe('EditorBidDialogComponent', () => {
  let component: EditorBidDialogComponent;
  let fixture: ComponentFixture<EditorBidDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorBidDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorBidDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
