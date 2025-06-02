import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundingOverviewComponent } from './funding-overview.component';

describe('FundingOverviewComponent', () => {
  let component: FundingOverviewComponent;
  let fixture: ComponentFixture<FundingOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundingOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
