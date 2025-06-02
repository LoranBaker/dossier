import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetAnalysisTabComponent } from './target-analysis-tab.component';

describe('TargetAnalysisTabComponent', () => {
  let component: TargetAnalysisTabComponent;
  let fixture: ComponentFixture<TargetAnalysisTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetAnalysisTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TargetAnalysisTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
