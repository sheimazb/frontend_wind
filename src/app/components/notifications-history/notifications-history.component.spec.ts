import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsHistoryComponent } from './notifications-history.component';

describe('NotificationsHistoryComponent', () => {
  let component: NotificationsHistoryComponent;
  let fixture: ComponentFixture<NotificationsHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NotificationsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
