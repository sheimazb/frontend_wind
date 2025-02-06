import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentDashAdminComponent } from './content-dash-admin.component';

describe('ContentDashAdminComponent', () => {
  let component: ContentDashAdminComponent;
  let fixture: ComponentFixture<ContentDashAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentDashAdminComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentDashAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
