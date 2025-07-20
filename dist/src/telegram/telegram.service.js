"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const dotenv = require("dotenv");
dotenv.config();
let TelegramService = class TelegramService {
    constructor() {
        this.logger = new common_1.Logger('TelegramService');
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        if (!this.token) {
            this.logger.warn('No Telegram bot token provided. Telegram notifications will be disabled.');
        }
        else {
            this.bot = new telegraf_1.Telegraf(this.token);
        }
    }
    async onModuleInit() {
        if (this.bot) {
            try {
                const botInfo = await this.bot.telegram.getMe();
                this.logger.log(`Telegram bot initialized: @${botInfo.username}`);
            }
            catch (error) {
                this.logger.error(`Failed to initialize Telegram bot: ${error.message}`);
            }
        }
    }
    async sendMessage(chatId, message) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized. Message not sent.');
            return;
        }
        const maxRetries = 3;
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                this.logger.log(`Message sent to chat ${chatId}`);
                return;
            }
            catch (error) {
                retryCount++;
                const isNetworkError = error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND';
                if (isNetworkError && retryCount < maxRetries) {
                    this.logger.warn(`Network error sending message to chat ${chatId}, retrying (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
                else {
                    this.logger.error(`Failed to send message to chat ${chatId} after ${retryCount} attempts: ${error.message}`);
                    if (isNetworkError) {
                        this.logger.error('Network connectivity issue with Telegram API. Please check your internet connection.');
                    }
                    break;
                }
            }
        }
    }
    async sendPhoto(chatId, photoUrl, caption) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized. Photo not sent.');
            return;
        }
        try {
            await this.bot.telegram.sendPhoto(chatId, photoUrl, {
                caption,
                parse_mode: 'Markdown',
            });
            this.logger.log(`Photo sent to chat ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send photo to chat ${chatId}: ${error.message}`);
        }
    }
    async sendDocument(chatId, documentUrl, caption) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized. Document not sent.');
            return;
        }
        try {
            await this.bot.telegram.sendDocument(chatId, documentUrl, {
                caption,
                parse_mode: 'Markdown',
            });
            this.logger.log(`Document sent to chat ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send document to chat ${chatId}: ${error.message}`);
        }
    }
    async sendLocation(chatId, latitude, longitude) {
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized. Location not sent.');
            return;
        }
        try {
            await this.bot.telegram.sendLocation(chatId, latitude, longitude);
            this.logger.log(`Location sent to chat ${chatId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send location to chat ${chatId}: ${error.message}`);
        }
    }
    getBot() {
        return this.bot;
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map