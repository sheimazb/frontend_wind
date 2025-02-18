import { Component } from '@angular/core';
import { Router , RouterModule } from '@angular/router';
@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './issue-page.component.html',
  styleUrl: './issue-page.component.css'
})
export class IssuePageComponent {
  constructor(private router: Router) {}
  onDashboardClick() {
    this.router.navigate(['/dashboardTesteur/issues']);
  }

}
