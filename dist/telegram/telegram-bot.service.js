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
exports.TelegramBotService = void 0;
const common_1 = require("@nestjs/common");
const telegraf_1 = require("telegraf");
const telegram_service_1 = require("./telegram.service");
const users_service_1 = require("../users/users.service");
const requests_service_1 = require("../requests/requests.service");
let TelegramBotService = class TelegramBotService {
    constructor(telegramService, usersService, requestsService) {
        this.telegramService = telegramService;
        this.usersService = usersService;
        this.requestsService = requestsService;
        this.userState = new Map();
        this.logger = new common_1.Logger('TelegramBotService');
        this.bot = this.telegramService.getBot();
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized. Bot commands will not work.');
            return;
        }
        this.bot.use((0, telegraf_1.session)());
        this.bot.catch((err, ctx) => {
            this.logger.error(`Bot error for ${ctx.updateType}:`, err);
        });
        this.setupCommands();
    }
    async onModuleInit() {
        if (this.bot) {
            try {
                await this.setCommandsWithRetry();
                await this.bot.launch();
                this.logger.log('Telegram bot started with polling');
                process.once('SIGINT', () => this.bot.stop('SIGINT'));
                process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
            }
            catch (error) {
                this.logger.error(`Failed to start Telegram bot: ${error.message}`);
                this.logger.warn('Bot will continue running but may not respond to commands properly');
            }
        }
    }
    async setCommandsWithRetry(maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.bot.telegram.setMyCommands([
                    { command: 'start', description: 'Start the bot' },
                    { command: 'help', description: 'Show help information' },
                    { command: 'link', description: 'Link your Telegram account to FleetMate' },
                    { command: 'myrequests', description: 'Show your car requests' },
                    { command: 'newrequest', description: 'Create a new car request' },
                    { command: 'approvals', description: 'Show your request status' },
                ]);
                this.logger.log('Bot commands set successfully');
                return;
            }
            catch (error) {
                this.logger.warn(`Failed to set bot commands (attempt ${i + 1}/${maxRetries}): ${error.message}`);
                if (i === maxRetries - 1) {
                    this.logger.error('Failed to set bot commands after all retries');
                }
                else {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
    }
    setupScenes() {
    }
    setupCommands() {
        this.bot.start(async (ctx) => {
            await ctx.reply(`👋 Welcome to FleetMate Bot!\n\nThis bot helps you manage car requests and receive notifications.\n\nTo get started, please link your FleetMate account using the /link command.\n\nType /help to see all available commands.`);
        });
        this.bot.help(async (ctx) => {
            await ctx.reply(`🚗 FleetMate Bot Commands:\n\n/start - Start the bot\n/help - Show this help message\n/link - Link your Telegram account to FleetMate\n/myrequests - Show your car requests\n/newrequest - Create a new car request\n/approvals - Show your request status`);
        });
        this.bot.command('link', async (ctx) => {
            const telegramId = ctx.from.id;
            if (!telegramId) {
                await ctx.reply('❌ Unable to get your Telegram ID.');
                return;
            }
            const existingUser = await this.usersService.findByTelegramId(telegramId.toString());
            if (existingUser) {
                await ctx.reply(`✅ Your account is already linked to ${existingUser.email}`);
                this.userState.delete(telegramId);
                return;
            }
            this.userState.set(telegramId, { command: 'link', step: 1, data: {} });
            await ctx.reply('To link your account, please provide your FleetMate email address:');
        });
        this.bot.command('newrequest', async (ctx) => {
            const userId = ctx.from.id;
            const user = await this.usersService.findByTelegramId(userId.toString());
            if (!user) {
                await ctx.reply('❌ Your Telegram account is not linked to FleetMate. Please use /link first.');
                return;
                await reqCtx.reply(`✅ **Request Created Successfully!**\n\n` +
                    `🆔 Request ID: ${newRequest.id.substring(0, 8)}...\n` +
                    `📍 Destination: ${requestData.destination}\n` +
                    `🎯 Purpose: ${requestData.purpose}\n` +
                    `🕐 Departure: ${requestData.departureDateTime.toLocaleString()}\n` +
                    `🕐 Return: ${requestData.returnDateTime.toLocaleString()}\n` +
                    `⚡ Priority: ${requestData.priority}\n\n` +
                    `Your request has been submitted and is now under review. You will receive notifications about status updates.`);
                isRequestListening = false;
            }
            try { }
            catch (error) {
                this.logger.error(`Error creating request: ${error.message}`);
                await reqCtx.reply('❌ An error occurred while creating your request. Please try again later.');
                isRequestListening = false;
            }
        });
    }
    ;
};
exports.TelegramBotService = TelegramBotService;
exports.TelegramBotService = TelegramBotService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => requests_service_1.RequestsService))),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        users_service_1.UsersService,
        requests_service_1.RequestsService])
], TelegramBotService);
this.bot.on('text', requestListener);
setTimeout(() => {
    isRequestListening = false;
}, 600000);
try { }
catch (error) {
    this.logger.error(`Error in newrequest command: ${error.message}`);
    await ctx.reply('❌ An error occurred. Please try again later.');
}
;
this.bot.command('myrequests', async (ctx) => {
    try {
        const user = await this.usersService.findByTelegramId(ctx.from.id.toString());
        if (!user) {
            await ctx.reply('❌ Your Telegram account is not linked to FleetMate. Please use /link first.');
            return;
        }
        const requests = await this.requestsService.findByUser(user.id);
        if (requests.length === 0) {
            await ctx.reply('🚗 Your Car Requests:\n\nNo requests found. Use /newrequest to create one.');
            return;
        }
        let message = '🚗 **Your Car Requests:**\n\n';
        for (const request of requests.slice(0, 5)) {
            const statusEmoji = this.getStatusEmoji(request.status);
            message += `${statusEmoji} **${request.id.substring(0, 8)}...** - ${request.status}\n`;
            message += `📍 ${request.destination}\n`;
            message += `🕐 ${new Date(request.departureDateTime).toLocaleDateString()}\n`;
            message += `⚡ ${request.priority}\n\n`;
        }
        if (requests.length > 5) {
            message += `... and ${requests.length - 5} more requests`;
        }
        await ctx.reply(message);
    }
    catch (error) {
        this.logger.error(`Error fetching requests: ${error.message}`);
        await ctx.reply('❌ An error occurred while fetching your requests. Please try again later.');
    }
});
this.bot.command('approvals', async (ctx) => {
    try {
        const user = await this.usersService.findByTelegramId(ctx.from.id.toString());
        if (!user) {
            await ctx.reply('❌ Your Telegram account is not linked to FleetMate. Please use /link first.');
            return;
        }
        if (user.role === 'approver' || user.role === 'admin' || user.role === 'authority') {
            const pendingApprovals = await this.requestsService.findPendingApprovals(user.id);
            if (pendingApprovals.length === 0) {
                await ctx.reply('📋 **Pending Approvals:**\n\nNo pending approvals found.');
                return;
            }
            let message = '📋 **Pending Approvals:**\n\n';
            for (const request of pendingApprovals.slice(0, 5)) {
                message += `🆔 **${request.id.substring(0, 8)}...** - ${request.user.firstName} ${request.user.lastName}\n`;
                message += `📍 ${request.destination}\n`;
                message += `🕐 ${new Date(request.departureDateTime).toLocaleDateString()}\n`;
                message += `⚡ ${request.priority}\n\n`;
            }
            await ctx.reply(message);
        }
        else {
            const requests = await this.requestsService.findByUser(user.id);
            const pendingRequests = requests.filter(r => r.status === 'submitted' ||
                r.status === 'under_review' ||
                r.status === 'eligible');
            if (pendingRequests.length === 0) {
                await ctx.reply('📋 **Your Request Status:**\n\nNo pending requests found.');
                return;
            }
            let message = '📋 **Your Request Status:**\n\n';
            for (const request of pendingRequests) {
                const statusEmoji = this.getStatusEmoji(request.status);
                message += `${statusEmoji} **${request.id.substring(0, 8)}...** - ${request.status}\n`;
                message += `📍 ${request.destination}\n`;
                message += `🕐 ${new Date(request.departureDateTime).toLocaleDateString()}\n`;
                if (request.approvals && request.approvals.length > 0) {
                    const latestApproval = request.approvals[request.approvals.length - 1];
                    message += `👤 Current approver: ${latestApproval.approver.firstName} ${latestApproval.approver.lastName}\n`;
                }
                message += '\n';
            }
            await ctx.reply(message);
        }
    }
    catch (error) {
        this.logger.error(`Error fetching approvals: ${error.message}`);
        await ctx.reply('❌ An error occurred while fetching approvals. Please try again later.');
    }
});
this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
async;
handleTextMessage(ctx, any);
{
    const userId = ctx.from.id;
    const state = this.userState.get(userId);
    if (state) {
        switch (state.command) {
            case 'link':
                await this.handleLinkConversation(ctx, userId, state);
                break;
        }
    }
    else {
        if (ctx.message.text.startsWith('/') && !this.isKnownCommand(ctx.message.text)) {
            await ctx.reply('❌ Unknown command. Type /help to see all available commands.');
        }
    }
}
async;
handleLinkConversation(ctx, any, userId, number, state, any);
{
    if (state.step === 1) {
        const email = ctx.message.text.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await ctx.reply('❌ Please provide a valid email address.');
            return;
        }
        try {
            const user = await this.usersService.findByEmail(email);
            if (!user) {
                await ctx.reply('❌ No FleetMate account found with this email address.');
                this.userState.delete(userId);
                return;
            }
            await this.usersService.updateTelegramInfo(user.id, {
                telegramId: userId.toString(),
                telegramUsername: ctx.from?.username || 'unknown',
            });
            await ctx.reply(`✅ Successfully linked your Telegram account to ${email}!\n\nYou can now use all FleetMate bot commands.`);
            this.userState.delete(userId);
        }
        catch (error) {
            this.logger.error(`Error linking account: ${error.message}`);
            await ctx.reply('❌ An error occurred while linking your account. Please try again.');
            this.userState.delete(userId);
        }
    }
}
isKnownCommand(text, string);
boolean;
{
    const knownCommands = ['/start', '/help', '/link', '/myrequests', '/newrequest', '/approvals'];
    const command = text.split(' ')[0];
    return knownCommands.includes(command);
}
getStatusEmoji(status, string);
string;
{
    const statusEmojis = {
        'submitted': '📝',
        'under_review': '👀',
        'eligible': '✅',
        'approved': '🎉',
        'rejected': '❌',
        'ineligible': '⛔',
        'car_assigned': '🚗',
        'in_progress': '🚙',
        'completed': '✅',
        'cancelled': '🚫'
    };
    return statusEmojis[status] || '📋';
}
//# sourceMappingURL=telegram-bot.service.js.map