import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplaceFilesDialogComponent } from './replace-files-dialog.component';

describe('ReplaceFilesDialogComponent', () => {
  let component: ReplaceFilesDialogComponent;
  let fixture: ComponentFixture<ReplaceFilesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplaceFilesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReplaceFilesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
