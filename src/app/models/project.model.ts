import { User } from "./user.model";

export interface Role {
  name: string;
}

export interface ProjectUser {
  user: User;
  role: Role;
}

export class Project {
    id: number = 0;
    name: string = '';
    description: string = '';
    technologies: string | string[] = '';  // Can be either string or string[]
    repositoryLink: string = '';
    progressPercentage: number = 0;
    deadlineDate: string = new Date().toISOString().split('T')[0];  // Format as YYYY-MM-DD
    membersCount: number = 0;
    payed: boolean = false;
    tenant: string = '';
    documentationUrls: string[] = [];
    tags: string[] = [];  // Changed from Set to array to match service
    allowedRoles: Role[] = [];  // Changed from Set to array
    creator: User | null = null;
    projectUsers: ProjectUser[] = [];  // Changed from Set to array

    constructor(init?: Partial<Project>) {
        if (init) {
            // Handle technologies specially
            if (init.technologies) {
                this.technologies = Array.isArray(init.technologies) ? 
                    init.technologies.join(',') : 
                    init.technologies;
            }
            
            // Handle date
            if (init.deadlineDate) {
                this.deadlineDate = new Date(init.deadlineDate).toISOString().split('T')[0];
            }

            // Handle arrays
            this.tags = init.tags || [];
            this.documentationUrls = init.documentationUrls || [];
            this.allowedRoles = init.allowedRoles || [];
            this.projectUsers = init.projectUsers || [];

            // Handle all other properties
            Object.assign(this, {
                ...init,
                technologies: this.technologies,  // Use our processed value
                deadlineDate: this.deadlineDate,  // Use our processed value
                tags: this.tags,
                documentationUrls: this.documentationUrls,
                allowedRoles: this.allowedRoles,
                projectUsers: this.projectUsers
            });
        }
    }
}