import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesPreviewModalComponent } from './files-preview-modal.component';

describe('FilesPreviewModalComponent', () => {
  let component: FilesPreviewModalComponent;
  let fixture: ComponentFixture<FilesPreviewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesPreviewModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilesPreviewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
