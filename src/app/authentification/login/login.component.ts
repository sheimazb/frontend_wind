import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports:[NavbarComponent,RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private router: Router) {}

  onSignInClick(){
    this.router.navigate(['/dashboardTesteur']);

  }
  onSignUpClick(){
    this.router.navigate(['/signup']);
  }
}
