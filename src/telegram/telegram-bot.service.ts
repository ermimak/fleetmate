import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';
import { RequestsService } from '../requests/requests.service';
import { ApprovalsService } from '../requests/approvals.service';
import { RequestStatus, RequestPriority } from '../requests/entities/car-request.entity';
import { CreateRequestDto } from '../requests/dto/create-request.dto';

interface UserState {
  command: 'link' | 'newrequest';
  step: number;
  data: any;
}

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly bot: Telegraf;
  private readonly logger = new Logger(TelegramBotService.name);
  private userState = new Map<number, UserState>();

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly requestsService: RequestsService,
    private readonly approvalsService: ApprovalsService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (token) {
      this.bot = new Telegraf(token);
    } else {
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
    } catch (error) {
      this.logger.error(`Failed to set bot commands: ${error.message}`);
    }

    this.bot.command('start', (ctx) => {
      ctx.reply(
        'Welcome to the FleetMate bot!\n\n' +
        'Use /help to see a list of available commands.\n' +
        'To get started, please /link your account.',
      );
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(
        'Available commands:\n' +
        '/start - Show welcome message\n' +
        '/help - Show this help message\n' +
        '/link - Link your Telegram account\n' +
        '/newrequest - Create a new car request\n' +
        '/myrequests - View your car requests\n' +
        '/approvals - View pending approvals',
      );
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
      } catch (error) {
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
          // For regular users, show their own request statuses
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
          const requestDetails =
            `*Request ID*: ${this.escapeMarkdownV2(request.id.substring(0, 8) + '...')}\n` +
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
      } catch (error) {
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
      } catch (error) {
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

        // In a real app, you'd likely prompt for a reason
        await this.approvalsService.reject(pendingApproval.id, 'Rejected via Telegram bot');
        await ctx.editMessageText(`❌ Request ${requestId.substring(0, 8)}... rejected.`);
      } catch (error) {
        this.logger.error(`Error rejecting request: ${error.message}`);
        await ctx.reply(`❌ Failed to reject request. Reason: ${error.message}`);
      }
    });

    this.bot.launch();
    this.logger.log('Telegram bot started');
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  private async handleTextMessage(ctx: any) {
    const userId = ctx.from.id;
    const state = this.userState.get(userId);

    if (state) {
      if (ctx.message.text.startsWith('/')) {
        await ctx.reply('⚠️ Command received. Cancelling current operation.');
        this.userState.delete(userId);
        // Do not return, let the command be processed by its own handler.
      } else {
        switch (state.command) {
          case 'link':
            await this.handleLinkConversation(ctx, userId, state);
            return; // Stop processing to avoid falling through to command handlers
          case 'newrequest':
            await this.handleNewRequestConversation(ctx, userId, state);
            return; // Stop processing
        }
      }
    }

    // Fallback for unknown commands if no state is active
    if (ctx.message.text.startsWith('/') && !this.isKnownCommand(ctx.message.text)) {
      await ctx.reply('❌ Unknown command. Type /help to see all available commands.');
    }
  }

  private async handleLinkConversation(ctx: any, userId: number, state: UserState) {
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
      } catch (error) {
        this.logger.error(`Error linking account: ${error.message}`);
        await ctx.reply('❌ An error occurred while linking your account. Please try again.');
        this.userState.delete(userId);
      }
    }
  }

  private async handleNewRequestConversation(ctx: any, userId: number, state: UserState) {
    const text = ctx.message.text.trim();
    const { data } = state;

    try {
      switch (state.step) {
        case 1: // Destination -> Purpose
          state.data.destination = text;
          state.step = 2;
          await ctx.reply('2️⃣ **Purpose**: What is the purpose of your trip?');
          break;

        case 2: // Purpose -> Departure Time
          state.data.purpose = text;
          state.step = 3;
          await ctx.reply('3️⃣ **Departure Date & Time**: When do you need to leave? (Format: YYYY-MM-DD HH:MM)');
          break;

        case 3: // Departure Time -> Return Time
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

        case 4: // Return Time -> Priority
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

        case 5: // Priority -> Create Request
          const priority = text.toLowerCase() as RequestPriority;
          if (!Object.values(RequestPriority).includes(priority)) {
            await ctx.reply('❌ Invalid priority. Please enter low, medium, or high.');
            return;
          }
          state.data.priority = priority;

          const { userId: requestUserId, ...rest } = state.data;
          const createRequestDto: CreateRequestDto = {
            ...rest,
            passengerCount: 1, // Default value
          };

          const newRequest = await this.requestsService.create(requestUserId, createRequestDto);

          await ctx.reply(
            `✅ **Request Created Successfully!**\n\n` +
            `🆔 Request ID: ${newRequest.id.substring(0, 8)}...\n` +
            `📍 Destination: ${createRequestDto.destination}\n` +
            `🎯 Purpose: ${createRequestDto.purpose}\n` +
            `🕐 Departure: ${createRequestDto.departureDateTime.toLocaleString()}\n` +
            `🕐 Return: ${createRequestDto.returnDateTime.toLocaleString()}\n` +
            `⚡ Priority: ${createRequestDto.priority}\n\n` +
            `Your request has been submitted and is now under review. You will receive notifications about status updates.`,
          );

          this.userState.delete(userId);
          break;
      }
    } catch (error) {
      this.logger.error(`Error in newrequest conversation: ${error.message}`);
      await ctx.reply('❌ An error occurred. Please try starting over with /newrequest.');
      this.userState.delete(userId);
    }
  }

  private parseDate(dateString: string): Date | null {
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
    const match = dateString.match(dateRegex);
    if (!match) return null;

    const [, year, month, day, hour, minute] = match.map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }

  private isKnownCommand(text: string): boolean {
    const knownCommands = ['/start', '/help', '/link', '/newrequest', '/myrequests', '/approvals'];
    return knownCommands.some(command => text.startsWith(command));
  }

  private getStatusEmoji(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.SUBMITTED:
        return '📝';
      case RequestStatus.UNDER_REVIEW:
      case RequestStatus.ELIGIBLE:
        return '👀';
      case RequestStatus.APPROVED:
      case RequestStatus.CAR_ASSIGNED:
        return '✅';
      case RequestStatus.IN_PROGRESS:
        return '🚀';
      case RequestStatus.COMPLETED:
        return '🏁';
      case RequestStatus.REJECTED:
      case RequestStatus.INELIGIBLE:
      case RequestStatus.CANCELLED:
        return '❌';
      default:
        return '❓';
    }
  }

  public escapeMarkdownV2(text: string): string {
    if (!text) return '';
    // Escape characters for Telegram MarkdownV2
    return text.replace(/([\_\*\`\{\}\[\]\(\)\#\+\-\=\|\!\.\>])/g, '\\$1');
  }

  async sendMessage(chatId: string, text: string, parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown') {
    try {
      const extra: any = {};
      if (parseMode) {
        extra.parse_mode = parseMode;
      }
      await this.bot.telegram.sendMessage(chatId, text, extra);
    } catch (error) {
      this.logger.error(`Failed to send message to ${chatId}: ${error.message}`);
    }
  }
}
