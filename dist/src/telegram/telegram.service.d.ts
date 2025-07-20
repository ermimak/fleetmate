import { OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
export declare class TelegramService implements OnModuleInit {
    private bot;
    private logger;
    private readonly token;
    constructor();
    onModuleInit(): Promise<void>;
    sendMessage(chatId: string, message: string): Promise<void>;
    sendPhoto(chatId: string, photoUrl: string, caption?: string): Promise<void>;
    sendDocument(chatId: string, documentUrl: string, caption?: string): Promise<void>;
    sendLocation(chatId: string, latitude: number, longitude: number): Promise<void>;
    getBot(): Telegraf;
}
