import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorSectionComponent } from './editor-section.component';

describe('EditorSectionComponent', () => {
  let component: EditorSectionComponent;
  let fixture: ComponentFixture<EditorSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
