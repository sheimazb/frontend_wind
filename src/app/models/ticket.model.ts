import { Log } from "./log.model";

export interface Ticket {
    id?: number;  // Optional because it's auto-generated
    title: string;
    description: string;
    status: Status;
    attachments?: string[];  // List of attachment URLs
    priority: Priority;
    assignedToUserId?: number;
    tenant: string;  // Required for multi-tenancy
    creatorUserId?: number;
    userEmail?: string;
    log?: Log;  // Relation with Log
    solution?: Solution;  // One-to-One relation
    comments?: Comment[];  // List of comments
    createdAt?: Date | string;
    updatedAt?: Date | string;
    logId?: number | string;
    logType?: string;
    projectId?: number | string;
}

export interface Solution {
    id?: number;
    ticketId: number;
    description: string;
    codeSnippet?: string;
    resourceLinks?: string[];
    createdByUserId?: number;
    createdByEmail?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface Comment {
    id?: number;
    ticketId: number;
    content: string;
    createdByUserId?: number;
    createdByEmail?: string;
    createdAt?: Date | string;
}

export enum Status {
    PENDING = "PENDING",
    RESOLVED = "RESOLVED",
    VERIFIED = "VERIFIED",
}

export enum Priority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL",
}
