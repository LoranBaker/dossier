import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenovationResultsTabComponent } from './renovation-results-tab.component';

describe('RenovationResultsTabComponent', () => {
  let component: RenovationResultsTabComponent;
  let fixture: ComponentFixture<RenovationResultsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenovationResultsTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenovationResultsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
