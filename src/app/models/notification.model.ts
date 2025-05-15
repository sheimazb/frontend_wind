export class Notification {
    id: number = 0;
    message: string = '';
    subject: string = '';
    type: string = 'info';
    sourceType: string = '';
    sourceId: number = 0;
    actionType: string = '';
    timestamp?: Date;
    recipientEmail: string = '';
    senderEmail: string = '';
    read: boolean = false;
    createdAt: Date = new Date();
    timeAgo: string = '';
    tenant: string = '';
}