import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Router,RouterModule } from '@angular/router';

@Component({
  selector: 'app-tester',
  standalone: true,
  imports: [SidebarComponent, FooterComponent, NavbarComponent,RouterModule],
  templateUrl: './tester.component.html',
  styleUrl: './tester.component.css'
})
export class TesterComponent {
  constructor(public router: Router) {}


}
