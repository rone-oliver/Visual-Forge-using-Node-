import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorksHistoryComponent } from './works-history.component';

describe('WorksHistoryComponent', () => {
  let component: WorksHistoryComponent;
  let fixture: ComponentFixture<WorksHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorksHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorksHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
