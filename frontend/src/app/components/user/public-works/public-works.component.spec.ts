import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicWorksComponent } from './public-works.component';

describe('PublicWorksComponent', () => {
  let component: PublicWorksComponent;
  let fixture: ComponentFixture<PublicWorksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicWorksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicWorksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
