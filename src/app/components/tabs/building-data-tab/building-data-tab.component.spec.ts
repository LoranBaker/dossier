import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingDataTabComponent } from './building-data-tab.component';

describe('BuildingDataTabComponent', () => {
  let component: BuildingDataTabComponent;
  let fixture: ComponentFixture<BuildingDataTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingDataTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildingDataTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
