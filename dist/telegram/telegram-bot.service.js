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
var TelegramBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const telegraf_1 = require("telegraf");
const users_service_1 = require("../users/users.service");
const requests_service_1 = require("../requests/requests.service");
const approvals_service_1 = require("../requests/approvals.service");
const car_request_entity_1 = require("../requests/entities/car-request.entity");
let TelegramBotService = TelegramBotService_1 = class TelegramBotService {
    constructor(configService, usersService, requestsService, approvalsService) {
        this.configService = configService;
        this.usersService = usersService;
        this.requestsService = requestsService;
        this.approvalsService = approvalsService;
        this.logger = new common_1.Logger(TelegramBotService_1.name);
        this.userState = new Map();
        const token = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (token) {
            this.bot = new telegraf_1.Telegraf(token);
        }
        else {
            this.logger.error('TELEGRAM_BOT_TOKEN is not configured.');
        }
    }
    async onModuleInit() {
        if (!this.bot) {
            this.logger.warn('Telegram bot not initialized. Bot commands will not work.');
            return;
        }
        this.logger.log('Setting up bot commands...');
        try {
            await this.bot.telegram.setMyCommands([
                { command: 'start', description: 'Welcome message' },
                { command: 'help', description: 'Show available commands' },
                { command: 'link', description: 'Link your Telegram to your FleetMate account' },
                { command: 'newrequest', description: 'Create a new car request' },
                { command: 'myrequests', description: 'View your car requests' },
                { command: 'approvals', description: 'View pending approvals (for approvers)' },
            ]);
            this.logger.log('Bot commands set successfully');
        }
        catch (error) {
            this.logger.error(`Failed to set bot commands: ${error.message}`);
        }
        this.bot.command('start', (ctx) => {
            ctx.reply('Welcome to the FleetMate bot!\n\n' +
                'Use /help to see a list of available commands.\n' +
                'To get started, please /link your account.');
        });
        this.bot.command('help', (ctx) => {
            ctx.reply('Available commands:\n' +
                '/start - Show welcome message\n' +
                '/help - Show this help message\n' +
                '/link - Link your Telegram account\n' +
                '/newrequest - Create a new car request\n' +
                '/myrequests - View your car requests\n' +
                '/approvals - View pending approvals');
        });
        this.bot.command('myrequests', async (ctx) => {
            try {
                const user = await this.usersService.findByTelegramId(ctx.from?.id.toString() || '');
                if (!user) {
                    await ctx.reply('❌ Your Telegram account is not linked. Please use /link first.');
                    return;
                }
                const requests = await this.requestsService.findByUser(user.id);
                if (requests.length === 0) {
                    await ctx.reply("You haven't made any requests yet.");
                    return;
                }
                let reply = 'Your requests:\n\n';
                requests.forEach((req) => {
                    const destination = this.escapeMarkdownV2(req.destination);
                    const status = this.escapeMarkdownV2(req.status);
                    const id = this.escapeMarkdownV2(req.id.substring(0, 8) + '...');
                    reply +=
                        `*Request ID*: ${id}\n` +
                            `*Destination*: ${destination}\n` +
                            `*Status*: ${this.getStatusEmoji(req.status)} ${status}\n\n`;
                });
                await ctx.reply(reply, { parse_mode: 'MarkdownV2' });
            }
            catch (error) {
                this.logger.error(`Error fetching requests: ${error.message}`);
                await ctx.reply('❌ An error occurred while fetching your requests.');
            }
        });
        this.bot.command('approvals', async (ctx) => {
            try {
                const user = await this.usersService.findByTelegramId(ctx.from.id.toString());
                if (!user) {
                    await ctx.reply('❌ Your Telegram account is not linked. Please use /link first.');
                    return;
                }
                if (!['authority', 'approver', 'admin'].includes(user.role)) {
                    const requests = await this.requestsService.findByUser(user.id);
                    if (requests.length === 0) {
                        await ctx.reply("You haven't made any requests yet.");
                        return;
                    }
                    let reply = 'Your requests:\n\n';
                    requests.forEach((req) => {
                        const destination = this.escapeMarkdownV2(req.destination);
                        const status = this.escapeMarkdownV2(req.status);
                        const id = this.escapeMarkdownV2(req.id.substring(0, 8) + '...');
                        reply +=
                            `*Request ID*: ${id}\n` +
                                `*Destination*: ${destination}\n` +
                                `*Status*: ${this.getStatusEmoji(req.status)} ${status}\n\n`;
                    });
                    await ctx.reply(reply, { parse_mode: 'MarkdownV2' });
                    return;
                }
                const pendingApprovals = await this.requestsService.findPendingApprovals(user.id);
                if (pendingApprovals.length === 0) {
                    await ctx.reply('✅ No pending approvals for you.');
                    return;
                }
                await ctx.reply('Pending approvals:');
                for (const request of pendingApprovals) {
                    const requestDetails = `*Request ID*: ${this.escapeMarkdownV2(request.id.substring(0, 8) + '...')}\n` +
                        `*User*: ${this.escapeMarkdownV2(request.user.fullName + ' (' + request.user.email + ')')}\n` +
                        `*Destination*: ${this.escapeMarkdownV2(request.destination)}\n` +
                        `*Purpose*: ${this.escapeMarkdownV2(request.purpose)}\n` +
                        `*Departure*: ${this.escapeMarkdownV2(new Date(request.departureDateTime).toLocaleString())}\n` +
                        `*Return*: ${this.escapeMarkdownV2(request.returnDateTime ? new Date(request.returnDateTime).toLocaleString() : 'N/A')}\n` +
                        `*Priority*: ${this.escapeMarkdownV2(request.priority)}\n` +
                        `*Status*: ${this.getStatusEmoji(request.status)} ${this.escapeMarkdownV2(request.status)}`;
                    await ctx.reply(requestDetails, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ Approve', callback_data: `approve:${request.id}` },
                                    { text: '❌ Reject', callback_data: `reject:${request.id}` },
                                ],
                            ],
                        },
                    });
                }
            }
            catch (error) {
                this.logger.error(`Error fetching approvals: ${error.message}`);
                await ctx.reply('❌ An error occurred while fetching approvals.');
            }
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
            }
            this.userState.set(userId, { command: 'newrequest', step: 1, data: { userId: user.id } });
            await ctx.reply('🚗 Creating a new car request...\n\nPlease provide the following information:\n\n1️⃣ **Destination**: Where do you need to go?');
        });
        this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
        this.bot.action(/approve:(.+)/, async (ctx) => {
            try {
                const user = await this.usersService.findByTelegramId(ctx.from.id.toString());
                if (!user) {
                    await ctx.reply('❌ Your Telegram account is not linked. Please use /link first.');
                    return;
                }
                const requestId = ctx.match[1];
                const approvals = await this.approvalsService.findByRequest(requestId);
                const pendingApproval = approvals.find(a => a.approverId === user.id && a.status === 'pending');
                if (!pendingApproval) {
                    await ctx.editMessageText('⚠️ This request is no longer pending your approval.');
                    return;
                }
                await this.approvalsService.approve(pendingApproval.id);
                await ctx.editMessageText(`✅ Request ${requestId.substring(0, 8)}... approved.`);
            }
            catch (error) {
                this.logger.error(`Error approving request: ${error.message}`);
                await ctx.reply(`❌ Failed to approve request. Reason: ${error.message}`);
            }
        });
        this.bot.action(/reject:(.+)/, async (ctx) => {
            try {
                const user = await this.usersService.findByTelegramId(ctx.from.id.toString());
                if (!user) {
                    await ctx.reply('❌ Your Telegram account is not linked. Please use /link first.');
                    return;
                }
                const requestId = ctx.match[1];
                const approvals = await this.approvalsService.findByRequest(requestId);
                const pendingApproval = approvals.find(a => a.approverId === user.id && a.status === 'pending');
                if (!pendingApproval) {
                    await ctx.editMessageText('⚠️ This request is no longer pending your approval.');
                    return;
                }
                await this.approvalsService.reject(pendingApproval.id, 'Rejected via Telegram bot');
                await ctx.editMessageText(`❌ Request ${requestId.substring(0, 8)}... rejected.`);
            }
            catch (error) {
                this.logger.error(`Error rejecting request: ${error.message}`);
                await ctx.reply(`❌ Failed to reject request. Reason: ${error.message}`);
            }
        });
        this.bot.launch();
        this.logger.log('Telegram bot started');
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
    async handleTextMessage(ctx) {
        const userId = ctx.from.id;
        const state = this.userState.get(userId);
        if (state) {
            if (ctx.message.text.startsWith('/')) {
                await ctx.reply('⚠️ Command received. Cancelling current operation.');
                this.userState.delete(userId);
            }
            else {
                switch (state.command) {
                    case 'link':
                        await this.handleLinkConversation(ctx, userId, state);
                        return;
                    case 'newrequest':
                        await this.handleNewRequestConversation(ctx, userId, state);
                        return;
                }
            }
        }
        if (ctx.message.text.startsWith('/') && !this.isKnownCommand(ctx.message.text)) {
            await ctx.reply('❌ Unknown command. Type /help to see all available commands.');
        }
    }
    async handleLinkConversation(ctx, userId, state) {
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
    async handleNewRequestConversation(ctx, userId, state) {
        const text = ctx.message.text.trim();
        const { data } = state;
        try {
            switch (state.step) {
                case 1:
                    state.data.destination = text;
                    state.step = 2;
                    await ctx.reply('2️⃣ **Purpose**: What is the purpose of your trip?');
                    break;
                case 2:
                    state.data.purpose = text;
                    state.step = 3;
                    await ctx.reply('3️⃣ **Departure Date & Time**: When do you need to leave? (Format: YYYY-MM-DD HH:MM)');
                    break;
                case 3:
                    const departureDate = this.parseDate(text);
                    if (!departureDate) {
                        await ctx.reply('❌ Invalid date format. Please use: YYYY-MM-DD HH:MM (e.g., 2025-07-20 14:30)');
                        return;
                    }
                    if (departureDate <= new Date()) {
                        await ctx.reply('❌ Departure time must be in the future.');
                        return;
                    }
                    state.data.departureDateTime = departureDate;
                    state.step = 4;
                    await ctx.reply('4️⃣ **Return Date & Time**: When do you plan to return? (Format: YYYY-MM-DD HH:MM)');
                    break;
                case 4:
                    const returnDate = this.parseDate(text);
                    if (!returnDate) {
                        await ctx.reply('❌ Invalid date format. Please use: YYYY-MM-DD HH:MM');
                        return;
                    }
                    if (returnDate <= state.data.departureDateTime) {
                        await ctx.reply('❌ Return time must be after the departure time.');
                        return;
                    }
                    state.data.returnDateTime = returnDate;
                    state.step = 5;
                    await ctx.reply('5️⃣ **Priority**: What is the priority? (low, medium, high)');
                    break;
                case 5:
                    const priority = text.toLowerCase();
                    if (!Object.values(car_request_entity_1.RequestPriority).includes(priority)) {
                        await ctx.reply('❌ Invalid priority. Please enter low, medium, or high.');
                        return;
                    }
                    state.data.priority = priority;
                    const { userId: requestUserId, ...rest } = state.data;
                    const createRequestDto = {
                        ...rest,
                        passengerCount: 1,
                    };
                    const newRequest = await this.requestsService.create(requestUserId, createRequestDto);
                    await ctx.reply(`✅ **Request Created Successfully!**\n\n` +
                        `🆔 Request ID: ${newRequest.id.substring(0, 8)}...\n` +
                        `📍 Destination: ${createRequestDto.destination}\n` +
                        `🎯 Purpose: ${createRequestDto.purpose}\n` +
                        `🕐 Departure: ${createRequestDto.departureDateTime.toLocaleString()}\n` +
                        `🕐 Return: ${createRequestDto.returnDateTime.toLocaleString()}\n` +
                        `⚡ Priority: ${createRequestDto.priority}\n\n` +
                        `Your request has been submitted and is now under review. You will receive notifications about status updates.`);
                    this.userState.delete(userId);
                    break;
            }
        }
        catch (error) {
            this.logger.error(`Error in newrequest conversation: ${error.message}`);
            await ctx.reply('❌ An error occurred. Please try starting over with /newrequest.');
            this.userState.delete(userId);
        }
    }
    parseDate(dateString) {
        const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
        const match = dateString.match(dateRegex);
        if (!match)
            return null;
        const [, year, month, day, hour, minute] = match.map(Number);
        return new Date(year, month - 1, day, hour, minute);
    }
    isKnownCommand(text) {
        const knownCommands = ['/start', '/help', '/link', '/newrequest', '/myrequests', '/approvals'];
        return knownCommands.some(command => text.startsWith(command));
    }
    getStatusEmoji(status) {
        switch (status) {
            case car_request_entity_1.RequestStatus.SUBMITTED:
                return '📝';
            case car_request_entity_1.RequestStatus.UNDER_REVIEW:
            case car_request_entity_1.RequestStatus.ELIGIBLE:
                return '👀';
            case car_request_entity_1.RequestStatus.APPROVED:
            case car_request_entity_1.RequestStatus.CAR_ASSIGNED:
                return '✅';
            case car_request_entity_1.RequestStatus.IN_PROGRESS:
                return '🚀';
            case car_request_entity_1.RequestStatus.COMPLETED:
                return '🏁';
            case car_request_entity_1.RequestStatus.REJECTED:
            case car_request_entity_1.RequestStatus.INELIGIBLE:
            case car_request_entity_1.RequestStatus.CANCELLED:
                return '❌';
            default:
                return '❓';
        }
    }
    escapeMarkdownV2(text) {
        if (!text)
            return '';
        return text.replace(/([\_\*\`\{\}\[\]\(\)\#\+\-\=\|\!\.\>])/g, '\\$1');
    }
    async sendMessage(chatId, text, parseMode) {
        try {
            const extra = {};
            if (parseMode) {
                extra.parse_mode = parseMode;
            }
            await this.bot.telegram.sendMessage(chatId, text, extra);
        }
        catch (error) {
            this.logger.error(`Failed to send message to ${chatId}: ${error.message}`);
        }
    }
};
exports.TelegramBotService = TelegramBotService;
exports.TelegramBotService = TelegramBotService = TelegramBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService,
        requests_service_1.RequestsService,
        approvals_service_1.ApprovalsService])
], TelegramBotService);
//# sourceMappingURL=telegram-bot.service.js.map