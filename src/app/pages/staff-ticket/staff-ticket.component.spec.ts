import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffTicketComponent } from './staff-ticket.component';

describe('StaffTicketComponent', () => {
  let component: StaffTicketComponent;
  let fixture: ComponentFixture<StaffTicketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffTicketComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StaffTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
