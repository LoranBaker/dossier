import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineTabComponent } from './timeline-tab.component';

describe('TimelineTabComponent', () => {
  let component: TimelineTabComponent;
  let fixture: ComponentFixture<TimelineTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelineTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
