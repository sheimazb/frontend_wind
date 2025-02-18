import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { MatIconModule } from '@angular/material/icon';

import {diAngularOriginal,diSpringOriginal,
  diReactOriginal
  ,diVuejsOriginal,
  diTypescriptOriginal,
  diNodejsOriginal,
  diJavaOriginal,
  

} from '@ng-icons/devicon/original';
@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [RouterModule,NgIcon,MatIconModule],
  templateUrl: './add-project.component.html',
  styleUrl: './add-project.component.css',
  viewProviders: [provideIcons({ diAngularOriginal,
    diSpringOriginal,
    diVuejsOriginal,
    diTypescriptOriginal,
    diNodejsOriginal,
    diJavaOriginal,
    diReactOriginal
   })]
})
export class AddProjectComponent {
  constructor(private router: Router) {}

  onDashboardClick() {
    this.router.navigate(['/dashboard/project']);
  }
 

}
