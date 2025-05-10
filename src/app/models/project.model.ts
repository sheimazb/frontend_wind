import { User } from "./user.model";
import { ProjectType } from '../services/project.service';

export interface Role {
  name: string;
}

export interface ProjectUser {
  user: User;
  role: Role;
}

export class Project {
    id?: number;
    name: string = '';
    description: string = '';
    technologies: string[] = [];
    repositoryLink: string = '';
    projectTag: string = ''; // This is the primaryTag field in backend
    deadlineDate: string = '';
    dueDate: string = '';
    logo?: any; // This can be a string URL or a File object
    tags: string[] = [];
    status: string = 'Active';
    priority: string = 'Medium';
    progressPercentage: number = 0;
    allowedRoles: any[] = [];
    creator?: any;
    owner?: any;
    createDate?: string;
    lastUpdateDate?: string;
    
    // New properties to match backend
    projectType: ProjectType = ProjectType.MONOLITHIC;
    parentProject?: Project;
    subProjects: Project[] = [];
    membersCount: number = 0;
    payed: boolean = false;
    tenant: string = '';
    documentationUrls: string[] = [];
    progress: number = 0;
    manager: string = '';
    totalTasks: number = 0;
    completedTasks: number = 0;
    inProgressTasks: number = 0;
    pendingTasks: number = 0;
    
    // Properties used in existing components
    startDate: string = '';
    projectUsers: ProjectUser[] = [];

    constructor(data: any = {}) {
        // Ensure id is a number if defined
        this.id = data.id !== undefined && data.id !== null ? Number(data.id) : undefined;
        this.name = data.name || '';
        this.description = data.description || '';
        this.technologies = data.technologies || [];
        this.repositoryLink = data.repositoryLink || '';
        this.projectTag = data.primaryTag || data.projectTag || ''; // Map primaryTag to projectTag for frontend consistency
        this.deadlineDate = data.deadlineDate || '';
        this.dueDate = data.dueDate || data.deadlineDate || ''; // Use deadlineDate as fallback
        this.startDate = data.startDate || data.createDate || '';
        this.logo = data.logo || null;
        this.tags = data.tags || [];
        this.status = data.status || 'Active';
        this.priority = data.priority || 'Medium';
        this.progressPercentage = data.progressPercentage || 0;
        this.allowedRoles = data.allowedRoles || [];
        this.creator = data.creator || undefined;
        this.owner = data.owner || undefined;
        this.createDate = data.createDate;
        this.lastUpdateDate = data.lastUpdateDate;
        this.projectUsers = data.projectUsers || [];
        
        // Set new properties
        this.projectType = data.projectType || ProjectType.MONOLITHIC;
        this.parentProject = data.parentProject ? new Project(data.parentProject) : undefined;
        this.subProjects = Array.isArray(data.subProjects) ? data.subProjects.map((subProject: any) => new Project(subProject)) : [];
        this.membersCount = data.membersCount || (this.projectUsers ? this.projectUsers.length : 0);
        this.payed = data.payed || false;
        this.tenant = data.tenant || '';
        this.documentationUrls = data.documentationUrls || [];
        this.manager = data.manager || '';
        this.totalTasks = data.totalTasks || 0;
        this.completedTasks = data.completedTasks || 0;
        this.inProgressTasks = data.inProgressTasks || 0;
        this.pendingTasks = data.pendingTasks || 0;

        // Handle technologies specially
        if (this.technologies) {
            this.technologies = Array.isArray(this.technologies) ? 
                this.technologies : 
                [this.technologies];
        }
        
        // Handle dates
        if (this.deadlineDate) {
            this.deadlineDate = new Date(this.deadlineDate).toISOString().split('T')[0];
            this.dueDate = this.deadlineDate; // Sync dueDate with deadlineDate
        }
        if (this.createDate) {
            this.createDate = new Date(this.createDate).toISOString().split('T')[0];
            if (!this.startDate) {
                this.startDate = this.createDate;
            }
        }
        if (this.lastUpdateDate) {
            this.lastUpdateDate = new Date(this.lastUpdateDate).toISOString().split('T')[0];
        }
        if (this.startDate) {
            this.startDate = new Date(this.startDate).toISOString().split('T')[0];
        }

        // Handle progress
        this.progress = this.progressPercentage || 0;

        // Handle all other properties
        Object.assign(this, {
            ...data,
            technologies: this.technologies,  // Use our processed value
            deadlineDate: this.deadlineDate,  // Use our processed value
            createDate: this.createDate,
            dueDate: this.dueDate,
            startDate: this.startDate,
            tags: this.tags,
            documentationUrls: this.documentationUrls,
            allowedRoles: this.allowedRoles,
            projectUsers: this.projectUsers,
            progress: this.progress
        });
    }

    // Helper method to safely get the project ID as a number
    // This helps fix TypeScript errors when using id in components
    getId(): number {
        return this.id !== undefined ? this.id : 0;
    }
}