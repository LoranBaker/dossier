import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationCtaComponent } from './consultation-cta.component';

describe('ConsultationCtaComponent', () => {
  let component: ConsultationCtaComponent;
  let fixture: ComponentFixture<ConsultationCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultationCtaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultationCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
