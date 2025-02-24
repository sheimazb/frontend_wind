import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  darkMode = false;
  dropdownOpen = false;
  currentUser: { email: string; fullName: string; role: string } | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if dark mode was previously enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
      this.darkMode = true;
      document.documentElement.classList.add('dark');
    }

    // Get current user data
    this.currentUser = this.authService.getCurrentUser();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
