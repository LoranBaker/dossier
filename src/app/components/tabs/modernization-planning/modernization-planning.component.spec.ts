import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModernizationPlanningComponent } from './modernization-planning.component';

describe('ModernizationPlanningComponent', () => {
  let component: ModernizationPlanningComponent;
  let fixture: ComponentFixture<ModernizationPlanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModernizationPlanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModernizationPlanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
