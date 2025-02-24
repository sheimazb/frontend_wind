import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogSettingsProfielComponent } from './dialog-settings-profiel.component';

describe('DialogSettingsProfielComponent', () => {
  let component: DialogSettingsProfielComponent;
  let fixture: ComponentFixture<DialogSettingsProfielComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogSettingsProfielComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogSettingsProfielComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
