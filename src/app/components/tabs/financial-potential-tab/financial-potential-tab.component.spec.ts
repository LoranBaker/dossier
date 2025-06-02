import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialPotentialTabComponent } from './financial-potential-tab.component';

describe('FinancialPotentialTabComponent', () => {
  let component: FinancialPotentialTabComponent;
  let fixture: ComponentFixture<FinancialPotentialTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialPotentialTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialPotentialTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
