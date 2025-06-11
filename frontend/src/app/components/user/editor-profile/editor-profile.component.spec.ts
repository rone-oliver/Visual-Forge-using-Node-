import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorProfileComponent } from './editor-profile.component';

describe('EditorProfileComponent', () => {
  let component: EditorProfileComponent;
  let fixture: ComponentFixture<EditorProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
