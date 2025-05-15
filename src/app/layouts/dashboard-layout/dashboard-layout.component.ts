import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/role.enum';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, FooterComponent],
  template: `
    <div [@fadeInAnimation]="animationState" class="dashboard-container fixed-layout">
      <app-navbar></app-navbar>

      <div class="flex overflow-hidden dark:bg-slate-950 bg-[#ECF8F6] pt-16 content-area">
        <app-sidebar></app-sidebar>

        <div
          id="main-content"
          class="h-full w-full dark:bg-slate-950 relative overflow-y-auto lg:ml-24"
        >
          <div class="flex flex-col min-h-screen">
            <main class="flex-grow">
              <router-outlet></router-outlet>
            </main>
            <app-footer class="mt-auto"></app-footer>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      opacity: 0;
      transform: translateY(20px);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    /* Position navbar fixed at the top */
    :host ::ng-deep app-navbar nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    
    /* Ensure sidebar stays fixed while scrolling */
    :host ::ng-deep app-sidebar #sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 990;
    }
    
    /* Main content area takes remaining space */
    #main-content {
      flex: 1;
      overflow-y: auto;
      margin-top: 0;
      height: calc(100vh - 64px); /* Adjust based on navbar height */
    }
  `],
  animations: [
    trigger('fadeInAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(20px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => visible', animate('800ms ease-out')),
    ])
  ]
})
export class DashboardLayoutComponent implements OnInit {
  userRole: Role | null = null;
  animationState: 'void' | 'visible' = 'void';
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role as Role || null;
    
    // Trigger the animation after a short delay
    setTimeout(() => {
      this.animationState = 'visible';
    }, 100);
  }
} 