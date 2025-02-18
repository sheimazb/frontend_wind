import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentStaffComponent } from './content-staff.component';

describe('ContentStaffComponent', () => {
  let component: ContentStaffComponent;
  let fixture: ComponentFixture<ContentStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentStaffComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
