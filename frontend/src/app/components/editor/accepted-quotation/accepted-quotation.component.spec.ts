import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptedQuotationComponent } from './accepted-quotation.component';

describe('AcceptedQuotationComponent', () => {
  let component: AcceptedQuotationComponent;
  let fixture: ComponentFixture<AcceptedQuotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptedQuotationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptedQuotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
