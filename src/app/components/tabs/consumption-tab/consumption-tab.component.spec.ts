import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumptionTabComponent } from './consumption-tab.component';

describe('ConsumptionTabComponent', () => {
  let component: ConsumptionTabComponent;
  let fixture: ComponentFixture<ConsumptionTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumptionTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsumptionTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
