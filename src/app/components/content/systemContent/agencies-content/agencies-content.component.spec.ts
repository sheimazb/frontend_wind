import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgenciesContentComponent } from './agencies-content.component';

describe('AgenciesContentComponent', () => {
  let component: AgenciesContentComponent;
  let fixture: ComponentFixture<AgenciesContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgenciesContentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgenciesContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
