import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
//import { ContentComponent } from '../../components/content/content.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-testeur-dashboard',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './testeur-dashboard.component.html',
  styleUrl: './testeur-dashboard.component.css'
})
export class TesteurDashboardComponent {

}
