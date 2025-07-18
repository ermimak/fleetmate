import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';
import { UsersService } from '../users/users.service';
export declare class TelegramController {
    private readonly telegramService;
    private readonly telegramBotService;
    private readonly usersService;
    constructor(telegramService: TelegramService, telegramBotService: TelegramBotService, usersService: UsersService);
    getStatus(): Promise<{
        success: boolean;
        message: string;
        botInitialized: boolean;
        timestamp: string;
    }>;
    webhook(update: any): Promise<{
        success: boolean;
    }>;
    sendMessage(req: any, body: {
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    sendNotification(userId: string, body: {
        title: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    broadcast(body: {
        title: string;
        message: string;
        roles?: string[];
    }): Promise<{
        success: boolean;
        sentCount: number;
    }>;
}
