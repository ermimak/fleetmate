import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RequestsService } from '../requests/requests.service';
import { ApprovalsService } from '../requests/approvals.service';
export declare class TelegramBotService implements OnModuleInit {
    private readonly configService;
    private readonly usersService;
    private readonly requestsService;
    private readonly approvalsService;
    private readonly bot;
    private readonly logger;
    private userState;
    constructor(configService: ConfigService, usersService: UsersService, requestsService: RequestsService, approvalsService: ApprovalsService);
    onModuleInit(): Promise<void>;
    private handleTextMessage;
    private handleLinkConversation;
    private handleNewRequestConversation;
    private parseDate;
    private isKnownCommand;
    private getStatusEmoji;
    escapeMarkdownV2(text: string): string;
    sendMessage(chatId: string, text: string, parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown'): Promise<void>;
}
