import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';


@Component({
  selector: 'app-testeur-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // Components
    NavbarComponent, 
    SidebarComponent, 
    FooterComponent, 
   
    // Pages
   
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  constructor(public router: Router) {}

  get showStats() {
    return this.router.url.includes('stats');
  }
  get showProjects() {
    return this.router.url.includes('project');
  }
}
