import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletDialogComponent } from './wallet-dialog.component';

describe('WalletDialogComponent', () => {
  let component: WalletDialogComponent;
  let fixture: ComponentFixture<WalletDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WalletDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
