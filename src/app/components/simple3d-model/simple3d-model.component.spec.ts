import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Simple3dModelComponent } from './simple3d-model.component';

describe('Simple3dModelComponent', () => {
  let component: Simple3dModelComponent;
  let fixture: ComponentFixture<Simple3dModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Simple3dModelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Simple3dModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
