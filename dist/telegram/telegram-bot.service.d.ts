import { OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UsersService } from '../users/users.service';
import { RequestsService } from '../requests/requests.service';
export declare class TelegramBotService implements OnModuleInit {
    private telegramService;
    private usersService;
    private requestsService;
    private userState;
    private logger;
    private bot;
    private stage;
    constructor(telegramService: TelegramService, usersService: UsersService, requestsService: RequestsService);
    onModuleInit(): Promise<void>;
    private setCommandsWithRetry;
    private setupScenes;
    private setupCommands;
    private handleTextMessage;
    private handleLinkConversation;
    private isKnownCommand;
    private getStatusEmoji;
}
