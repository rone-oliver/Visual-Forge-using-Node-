import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorListingComponent } from './editor-listing.component';

describe('EditorListingComponent', () => {
  let component: EditorListingComponent;
  let fixture: ComponentFixture<EditorListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
