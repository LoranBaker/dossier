import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialBenefitsTabComponent } from './financial-benefits-tab.component';

describe('FinancialBenefitsTabComponent', () => {
  let component: FinancialBenefitsTabComponent;
  let fixture: ComponentFixture<FinancialBenefitsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialBenefitsTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialBenefitsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
