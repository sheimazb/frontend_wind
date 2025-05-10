import { Pipe, PipeTransform } from '@angular/core';
import { Project } from '../../../../models/project.model';

@Pipe({ name: 'projectType', standalone: true })
export class ProjectTypePipe implements PipeTransform {
  transform(projects: Project[], type: 'all' | 'package' | 'monolithic'): Project[] {
    if (!projects) return [];
    if (type === 'all') return projects;
    if (type === 'package') return projects.filter(p => p.projectType === 'MICROSERVICES_PACKAGE');
    if (type === 'monolithic') return projects.filter(p => p.projectType !== 'MICROSERVICES_PACKAGE');
    return projects;
  }
} 