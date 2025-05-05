import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FullscreenService {
  // Observable for tracking fullscreen state
  private fullscreenSubject = new BehaviorSubject<boolean>(false);
  fullscreen$ = this.fullscreenSubject.asObservable();

  constructor() {
    // Listen for browser fullscreen change events
    document.addEventListener('fullscreenchange', () => {
      this.fullscreenSubject.next(!!document.fullscreenElement);
    });
  }

  /**
   * Toggle fullscreen mode
   * @param element Element to make fullscreen (default: document.documentElement)
   * @returns Promise that resolves when the operation is complete
   */
  async toggleFullscreen(element: HTMLElement = document.documentElement): Promise<void> {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen mode
        await element.requestFullscreen();
        this.fullscreenSubject.next(true);
      } else {
        // Exit fullscreen mode
        await document.exitFullscreen();
        this.fullscreenSubject.next(false);
      }
    } catch (err) {
      console.error('Fullscreen API error:', err);
      
      // If browser fullscreen API fails, we can still use our custom fullscreen mode
      this.fullscreenSubject.next(!this.fullscreenSubject.value);
    }
  }

  /**
   * Check if browser is in fullscreen mode
   */
  isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }
  
  /**
   * Set fullscreen state without using browser API
   * Useful for custom fullscreen implementations
   */
  setFullscreenState(state: boolean): void {
    this.fullscreenSubject.next(state);
  }
} 