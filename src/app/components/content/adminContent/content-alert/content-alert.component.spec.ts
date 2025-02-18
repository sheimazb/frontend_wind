import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentAlertComponent } from './content-alert.component';

describe('ContentAlertComponent', () => {
  let component: ContentAlertComponent;
  let fixture: ComponentFixture<ContentAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentAlertComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
