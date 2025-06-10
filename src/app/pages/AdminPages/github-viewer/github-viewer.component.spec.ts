import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubViewerComponent } from './github-viewer.component';

describe('GithubViewerComponent', () => {
  let component: GithubViewerComponent;
  let fixture: ComponentFixture<GithubViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GithubViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GithubViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
