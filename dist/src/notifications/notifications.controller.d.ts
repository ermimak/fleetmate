import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    sendNotification(body: {
        userId: string;
        title: string;
        message: string;
    }): Promise<{
        success: boolean;
    }>;
    broadcastNotification(body: {
        title: string;
        message: string;
        roles?: string[];
    }): Promise<{
        success: boolean;
    }>;
    testConnection(req: any): Promise<{
        success: boolean;
        userId: any;
    }>;
}
