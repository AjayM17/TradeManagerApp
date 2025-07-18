import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddHoldingComponent } from './add-holding.component';

describe('AddHoldingComponent', () => {
  let component: AddHoldingComponent;
  let fixture: ComponentFixture<AddHoldingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AddHoldingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHoldingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
