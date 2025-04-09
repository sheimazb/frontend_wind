import { Ticket } from "./ticket.model";

export interface Log {
    id?: number | string;  
    type: LogType | string;
    timestamp: Date | string;
    description: string;
    source: string;
    errorCode?: string;     
    customMessage?: string;  
    severity: LogSeverity | string;
    tenant: string;
    createdAt?: Date;  
    projectId: number | string;
    tickets?: Ticket[];
    className?: string;
    containerName?: string;
    containerId?: string;
    thread?: string;
    tag?: string;
    handled?: boolean;
    originalTimestamp?:string;
}

export enum LogType {
    ERROR = "ERROR",
    WARNING = "WARNING",
    INFO = "INFO",
    DEBUG = "DEBUG",
}

export enum LogSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL",
}

