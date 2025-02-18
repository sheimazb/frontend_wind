import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentProjectDashAdminComponent } from './content-project-dash-admin.component';

describe('ContentProjectDashAdminComponent', () => {
  let component: ContentProjectDashAdminComponent;
  let fixture: ComponentFixture<ContentProjectDashAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentProjectDashAdminComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentProjectDashAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
