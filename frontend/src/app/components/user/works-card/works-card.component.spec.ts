import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorksCardComponent } from './works-card.component';

describe('WorksCardComponent', () => {
  let component: WorksCardComponent;
  let fixture: ComponentFixture<WorksCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorksCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorksCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
