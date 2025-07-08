import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiddedQuotationsComponent } from './bidded-quotations.component';

describe('BiddedQuotationsComponent', () => {
  let component: BiddedQuotationsComponent;
  let fixture: ComponentFixture<BiddedQuotationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiddedQuotationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiddedQuotationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
