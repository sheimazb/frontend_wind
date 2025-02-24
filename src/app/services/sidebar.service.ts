import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Initialize sidebar visibility based on screen size
  private isLargeScreen = window.innerWidth >= 1024;
  private sidebarVisibilitySubject = new BehaviorSubject<boolean>(this.isLargeScreen);
  sidebarVisibility$ = this.sidebarVisibilitySubject.asObservable();

  constructor() {
    // Listen for window resize events to update sidebar visibility
    window.addEventListener('resize', () => {
      const isLargeScreen = window.innerWidth >= 1024;
      if (isLargeScreen) {
        this.sidebarVisibilitySubject.next(true);
      }
    });
  }

  toggleSidebar() {
    this.sidebarVisibilitySubject.next(!this.sidebarVisibilitySubject.value);
  }
} 