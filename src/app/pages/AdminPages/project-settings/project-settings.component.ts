import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [RouterModule,MatIconModule,MatTooltipModule,MatDividerModule,MatMenuModule],
  templateUrl: './project-settings.component.html',
  styleUrl: './project-settings.component.css'
})
export class ProjectSettingsComponent {
  constructor(private router: Router) {}

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
 
}
