export class Notification {
    id: number = 0;
    message: string = '';
    title:string = '';
    type: string = 'info';
    timestamp?: Date;
    recipientEmail: string = '';
    read: boolean = false;
    createdAt: Date = new Date();
    timeAgo: string = '';
    sourceId: number = 0;
    tenant: string = '';
   
}