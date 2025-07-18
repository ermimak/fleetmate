import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { NotificationGateway } from './notification.gateway';
import { CarRequest } from '../requests/entities/car-request.entity';
import { Approval } from '../requests/entities/approval.entity';
export declare class NotificationsService {
    private telegramService;
    private usersService;
    private notificationGateway;
    constructor(telegramService: TelegramService, usersService: UsersService, notificationGateway: NotificationGateway);
    notifyNewRequest(request: CarRequest): Promise<void>;
    notifyRequestStatusChange(request: CarRequest): Promise<void>;
    notifyCarAssigned(request: CarRequest): Promise<void>;
    notifyApprovalAssigned(approval: Approval): Promise<void>;
    notifyApprovalDecision(approval: Approval, isApproved: boolean): Promise<void>;
    sendGeneralNotification(userId: string, title: string, message: string): Promise<void>;
    broadcastNotification(title: string, message: string, roles?: string[]): Promise<void>;
}
