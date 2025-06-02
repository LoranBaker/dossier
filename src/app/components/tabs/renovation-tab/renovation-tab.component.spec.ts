import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenovationTabComponent } from './renovation-tab.component';

describe('RenovationTabComponent', () => {
  let component: RenovationTabComponent;
  let fixture: ComponentFixture<RenovationTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenovationTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenovationTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
