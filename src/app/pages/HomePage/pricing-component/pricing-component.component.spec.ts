import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingComponentComponent } from './pricing-component.component';

describe('PricingComponentComponent', () => {
  let component: PricingComponentComponent;
  let fixture: ComponentFixture<PricingComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PricingComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
