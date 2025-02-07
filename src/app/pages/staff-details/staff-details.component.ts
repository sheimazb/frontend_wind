import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
@Component({
  selector: 'app-staff-details',
  standalone: true,
  imports: [RouterModule,MatIconModule,MatTooltipModule,MatDividerModule],
  templateUrl: './staff-details.component.html',
  styleUrl: './staff-details.component.css'
})
export class StaffDetailsComponent {
  constructor(private router: Router) {}
  onDashboardClick() {
    this.router.navigate(['/dashboard/staff']);
  }
}
