import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface TerminalLine {
  text: string;
  class: string;
}

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate('800ms ease-in-out')),
    ]),
    trigger('slideUpDown', [
      state('void', style({
        transform: 'translateY(20px)',
        opacity: 0
      })),
      transition('void => *', animate('600ms 300ms ease-out')),
      transition('* => void', animate('300ms ease-in'))
    ])
  ]
})
export class LoadingScreenComponent implements OnInit, OnDestroy {
  progress = 0;
  status = 'Initializing...';
  timeElapsed = '00:00:00';
  startTime: number;
  timeInterval: any;
  redirectTimer: any;
  animationState = 'in';
  particleAnimationInterval: any;
  typingTimer: any;
  typingSound: HTMLAudioElement | null = null;

  // Terminal lines to be typed out
  terminalLines: TerminalLine[] = [
    { text: "[INFO] Starting WindLogs application...", class: "log-info" },
    { text: "[DEBUG] Loading application context", class: "log-debug" },
    { text: "[DEBUG] Prepering project data", class: "log-debug" },
    { text: "[WARNING] Windlogs is loading", class: "log-warning" },
    { text: "[DEBUG] Preparing user data", class: "log-debug" },
    { text: "[INFO] Loading dashboard components", class: "log-info" },
    { text: "[SUCCESS] Application started successfully", class: "log-success" }
  ];

  currentLineIndex = 0;
  currentCharIndex = 0;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.startTime = Date.now();
  }

  ngOnInit() {
    // Create floating particles
    this.createParticles();
    
    // Animate particles
    this.animateParticles();
    
    // Load typing sound
    this.loadTypingSound();
    
    // Start typing animation
    this.startTypingAnimation();
    
    // Start progress animation
    this.animateProgress();
    
    // Start time counter
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
    
    // Set a timer to redirect after loading completes (adjust time as needed)
    this.redirectTimer = setTimeout(() => {
      this.prepareRedirect();
    }, 18000); 
  }

  ngOnDestroy() {
    // Clear intervals and timers
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
    if (this.particleAnimationInterval) {
      clearInterval(this.particleAnimationInterval);
    }
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    // Stop sound
    if (this.typingSound) {
      this.typingSound.pause();
      this.typingSound.currentTime = 0;
    }
  }

  private loadTypingSound() {
    // Initialize the typing sound
    this.typingSound = document.getElementById('typingSound') as HTMLAudioElement;
    if (this.typingSound) {
      this.typingSound.volume = 0.3; // Set volume to 30%
      this.typingSound.loop = true;
    }
  }

  private startTypingAnimation() {
    // Add cursor to the terminal
    this.addCursorToTerminal();
    
    // Start typing the first line
    this.typeNextCharacter();
  }

  private addCursorToTerminal() {
    const terminal = document.getElementById('terminal');
    if (terminal) {
      const cursorElement = document.createElement('span');
      cursorElement.className = 'cursor';
      terminal.appendChild(cursorElement);
    }
  }

  private typeNextCharacter() {
    // Get current line and check if we're done with all lines
    if (this.currentLineIndex >= this.terminalLines.length) {
      // Stop typing sound
      if (this.typingSound) {
        this.typingSound.pause();
        this.typingSound.currentTime = 0;
      }
      return;
    }

    const terminal = document.getElementById('terminal');
    if (!terminal) return;

    const currentLine = this.terminalLines[this.currentLineIndex];
    
    // Start typing sound at the beginning of a new line
    if (this.currentCharIndex === 0 && this.typingSound) {
      this.typingSound.play().catch(error => console.error('Error playing sound:', error));
    }

    // Create line element with appropriate class if starting a new line
    if (this.currentCharIndex === 0) {
      // Remove cursor from previous line if exists
      const cursor = terminal.querySelector('.cursor');
      if (cursor) {
        cursor.remove();
      }
      
      // Create new line element
      const lineElement = document.createElement('div');
      lineElement.className = currentLine.class;
      lineElement.id = `line-${this.currentLineIndex}`;
      terminal.appendChild(lineElement);
      
      // Add cursor to the new line
      const cursorElement = document.createElement('span');
      cursorElement.className = 'cursor';
      lineElement.appendChild(cursorElement);
    }

    const lineElement = document.getElementById(`line-${this.currentLineIndex}`);
    if (!lineElement) return;

    // If we haven't typed all characters of the current line
    if (this.currentCharIndex < currentLine.text.length) {
      // Remove cursor
      const cursor = lineElement.querySelector('.cursor');
      if (cursor) {
        cursor.remove();
      }
      
      // Add next character
      lineElement.textContent = currentLine.text.substring(0, this.currentCharIndex + 1);
      
      // Add cursor back
      const cursorElement = document.createElement('span');
      cursorElement.className = 'cursor';
      lineElement.appendChild(cursorElement);
      
      // Increment character index
      this.currentCharIndex++;
      
      // Schedule typing of next character with random delay
      const typingSpeed = Math.random() * 60 + 20; // 20-80ms
      this.typingTimer = setTimeout(() => {
        this.typeNextCharacter();
      }, typingSpeed);
    } else {
      // Move cursor to next line
      const cursor = lineElement.querySelector('.cursor');
      if (cursor) {
        cursor.remove();
      }
      
      // Move to next line
      this.currentLineIndex++;
      this.currentCharIndex = 0;
      
      // Pause typing sound briefly between lines
      if (this.typingSound) {
        this.typingSound.pause();
        this.typingSound.currentTime = 0;
      }
      
      // Wait a bit longer between lines
      this.typingTimer = setTimeout(() => {
        this.typeNextCharacter();
      }, 300);
    }
    
    // Auto-scroll the terminal
    terminal.scrollTop = terminal.scrollHeight;
  }

  private prepareRedirect() {
    // Trigger fade out animation
    this.animationState = 'void';
    setTimeout(() => {
      this.redirectBasedOnRole();
    }, 500); // Short delay for animation to complete
  }

  private createParticles() {
    setTimeout(() => {
      const particlesContainer = document.getElementById('particles');
      if (particlesContainer) {
        for (let i = 0; i < 50; i++) {
          const particle = document.createElement('div');
          particle.classList.add('particle');
          
          // Random position
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;
          
          // Random size
          const size = Math.random() * 3 + 1;
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          
          // Random opacity
          particle.style.opacity = (Math.random() * 0.5 + 0.3).toString();
          
          // Add custom animation duration
          const animationDuration = Math.random() * 10 + 10;
          particle.style.animation = `float ${animationDuration}s linear infinite`;
          
          particlesContainer.appendChild(particle);
        }
      }
    }, 0);
  }

  private animateParticles() {
    this.particleAnimationInterval = setInterval(() => {
      const particles = document.querySelectorAll('.particle');
      particles.forEach((element: Element) => {
        const particle = element as HTMLElement;
        // Small random movement
        const currentTop = parseFloat(particle.style.top);
        const currentLeft = parseFloat(particle.style.left);
        
        // Add subtle movement
        const newTop = currentTop + (Math.random() * 0.5 - 0.25);
        const newLeft = currentLeft + (Math.random() * 0.5 - 0.25);
        
        // Keep within bounds
        particle.style.top = `${Math.max(0, Math.min(100, newTop))}%`;
        particle.style.left = `${Math.max(0, Math.min(100, newLeft))}%`;
        
        // Random opacity change
        const currentOpacity = parseFloat(particle.style.opacity || '0.3');
        const newOpacity = currentOpacity + (Math.random() * 0.05 - 0.025);
        particle.style.opacity = Math.max(0.2, Math.min(0.8, newOpacity)).toString();
      });
    }, 200);
  }

  private animateProgress() {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      this.progress = currentProgress;
      
      // Update status message based on progress
      if (currentProgress < 20) {
        this.status = 'Initializing...';
      } else if (currentProgress < 40) {
        this.status = 'Loading application context...';
      } else if (currentProgress < 60) {
        this.status = 'Preparing dashboard...';
      } else if (currentProgress < 80) {
        this.status = 'Loading user data...';
      } else if (currentProgress < 95) {
        this.status = 'Finalizing...';
      } else {
        this.status = 'Complete';
      }
      
      // Stop when progress reaches 100%
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 120); // Slowed down slightly to match the typing
  }

  private updateTime() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    this.timeElapsed = `${hours}:${minutes}:${seconds}`;
  }

  private redirectBasedOnRole() {
    const user = this.authService.getCurrentUser();
    if (user) {
      switch (user.role) {
        case 'PARTNER':
          this.router.navigate(['/dashboard/project']);
          break;
        case 'DEVELOPER':
          this.router.navigate(['/dashboard/tasks']);
          break;
        case 'TESTER':
          this.router.navigate(['/dashboard/issues']);
          break;
        case 'CHEF':
          this.router.navigate(['/dashboard/project-management']);
          break;
        case 'ADMIN':
          this.router.navigate(['/dashboard/agencies']);
          break;
        default:
          this.router.navigate(['/dashboard']);
      }
    } else {
      // If user data isn't available, go to main dashboard
      this.router.navigate(['/dashboard']);
    }
  }
} 