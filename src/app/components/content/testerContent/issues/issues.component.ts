import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { diAngularOriginal } from '@ng-icons/devicon/original';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [RouterModule,MatIconModule,MatTooltipModule,MatDividerModule,MatCheckboxModule,NgIcon],
  templateUrl: './issues.component.html',
  styleUrl: './issues.component.css',
  viewProviders: [provideIcons({ diAngularOriginal })]
})
export class IssuesComponent {
  constructor(private router: Router) {}

  onissueClick(){
    this.router.navigate(['/dashboardTesteur/issue-details']);
  }
}
