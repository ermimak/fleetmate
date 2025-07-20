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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const telegram_service_1 = require("./telegram.service");
const telegram_bot_service_1 = require("./telegram-bot.service");
const users_service_1 = require("../users/users.service");
let TelegramController = class TelegramController {
    constructor(telegramService, telegramBotService, usersService) {
        this.telegramService = telegramService;
        this.telegramBotService = telegramBotService;
        this.usersService = usersService;
    }
    async getStatus() {
        return {
            success: true,
            message: 'Telegram bot service is running',
            botInitialized: !!this.telegramService.getBot(),
            timestamp: new Date().toISOString()
        };
    }
    async webhook(update) {
        return { success: true };
    }
    async sendMessage(req, body) {
        const user = await this.usersService.findOne(req.user.userId);
        if (!user.telegramId) {
            return { success: false, message: 'Your account is not linked with Telegram' };
        }
        await this.telegramService.sendMessage(user.telegramId, body.message);
        return { success: true };
    }
    async sendNotification(userId, body) {
        const user = await this.usersService.findOne(userId);
        if (!user.telegramId) {
            return { success: false, message: 'User account is not linked with Telegram' };
        }
        const message = `📢 ${body.title}\n\n${body.message}`;
        await this.telegramService.sendMessage(user.telegramId, message);
        return { success: true };
    }
    async broadcast(body) {
        let users = [];
        if (body.roles && body.roles.length > 0) {
            for (const roleStr of body.roles) {
                const role = roleStr;
                const usersWithRole = await this.usersService.findByRole(role);
                users = [...users, ...usersWithRole];
            }
        }
        else {
            users = await this.usersService.findAll();
        }
        const message = `📢 ${body.title}\n\n${body.message}`;
        let sentCount = 0;
        for (const user of users) {
            if (user.telegramId) {
                await this.telegramService.sendMessage(user.telegramId, message);
                sentCount++;
            }
        }
        return { success: true, sentCount };
    }
};
exports.TelegramController = TelegramController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "webhook", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('send-message'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('send-notification/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('broadcast'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "broadcast", null);
exports.TelegramController = TelegramController = __decorate([
    (0, common_1.Controller)('telegram'),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        telegram_bot_service_1.TelegramBotService,
        users_service_1.UsersService])
], TelegramController);
//# sourceMappingURL=telegram.controller.js.map