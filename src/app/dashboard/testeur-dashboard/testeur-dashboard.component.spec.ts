import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesteurDashboardComponent } from './testeur-dashboard.component';

describe('TesteurDashboardComponent', () => {
  let component: TesteurDashboardComponent;
  let fixture: ComponentFixture<TesteurDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesteurDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TesteurDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
