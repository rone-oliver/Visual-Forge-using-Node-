import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsResolutionComponent } from './reports-resolution.component';

describe('ReportsResolutionComponent', () => {
  let component: ReportsResolutionComponent;
  let fixture: ComponentFixture<ReportsResolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsResolutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsResolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
