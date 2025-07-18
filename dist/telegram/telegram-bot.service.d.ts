import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RequestsService } from '../requests/requests.service';
export declare class TelegramBotService implements OnModuleInit {
    private readonly configService;
    private readonly usersService;
    private readonly requestsService;
    private readonly bot;
    private readonly logger;
    private userState;
    constructor(configService: ConfigService, usersService: UsersService, requestsService: RequestsService);
    onModuleInit(): Promise<void>;
    private handleTextMessage;
    private handleLinkConversation;
    private handleNewRequestConversation;
    private parseDate;
    private isKnownCommand;
    private getStatusEmoji;
}
