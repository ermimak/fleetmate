import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Telegraf, Scenes, session, Context } from 'telegraf';
import { TelegramService } from './telegram.service';
import { UsersService } from '../users/users.service';
import { RequestsService } from '../requests/requests.service';
import { RequestPriority } from '../requests/entities/car-request.entity';

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private userState = new Map<number, { command: string; step: number; data: any }>();
  private logger = new Logger('TelegramBotService');
  private bot: Telegraf;
  private stage: any;

  constructor(
    private telegramService: TelegramService,
    private usersService: UsersService,
    @Inject(forwardRef(() => RequestsService))
    private requestsService: RequestsService,
  ) {
    this.bot = this.telegramService.getBot();
    if (!this.bot) {
      this.logger.warn('Telegram bot not initialized. Bot commands will not work.');
      return;
    }

    // Setup middleware
    this.bot.use(session());
    
    // Add global error handler
    this.bot.catch((err, ctx) => {
      this.logger.error(`Bot error for ${ctx.updateType}:`, err);
      // Don't crash the bot, just log the error
    });
    
    // Setup commands
    this.setupCommands();
  }

  async onModuleInit() {
    if (this.bot) {
      try {
        // Set bot commands (with timeout and retry)
        await this.setCommandsWithRetry();

        // Start the bot with polling
        await this.bot.launch();
        this.logger.log('Telegram bot started with polling');

        // Enable graceful stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
      } catch (error) {
        this.logger.error(`Failed to start Telegram bot: ${error.message}`);
        this.logger.warn('Bot will continue running but may not respond to commands properly');
      }
    }
  }

  private async setCommandsWithRetry(maxRetries = 3) {
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
      } catch (error) {
        this.logger.warn(`Failed to set bot commands (attempt ${i + 1}/${maxRetries}): ${error.message}`);
        if (i === maxRetries - 1) {
          this.logger.error('Failed to set bot commands after all retries');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  }

  // Simplified approach without complex scenes for now
  private setupScenes() {
    // We'll implement simpler command-based interactions
  }

  private setupCommands() {
    // Start command
    this.bot.start(async (ctx) => {
      await ctx.reply(
        `👋 Welcome to FleetMate Bot!\n\nThis bot helps you manage car requests and receive notifications.\n\nTo get started, please link your FleetMate account using the /link command.\n\nType /help to see all available commands.`
      );
    });

    // Help command
    this.bot.help(async (ctx) => {
      await ctx.reply(
        `🚗 FleetMate Bot Commands:\n\n/start - Start the bot\n/help - Show this help message\n/link - Link your Telegram account to FleetMate\n/myrequests - Show your car requests\n/newrequest - Create a new car request\n/approvals - Show your request status`
      );
    });

    // Link command
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
    
    // Command to create new request
    this.bot.command('newrequest', async (ctx) => {
      try {
        const user = await this.usersService.findByTelegramId(ctx.from?.id.toString() || '');
        if (!user) {
          await ctx.reply('❌ Your Telegram account is not linked to FleetMate. Please use /link first.');
          return;
        }

        await ctx.reply('🚗 Creating a new car request...\n\nPlease provide the following information:\n\n1️⃣ **Destination**: Where do you need to go?');
        
        const requestData: {
          step: number;
          destination?: string;
          purpose?: string;
          departureDateTime?: Date;
          returnDateTime?: Date;
          priority?: RequestPriority;
        } = { step: 1 };
        
        let isRequestListening = true;
        const requestListener = async (reqCtx) => {
          if (!isRequestListening || reqCtx.from?.id !== ctx.from?.id) return;
          
          // Skip if this is a command
          if (reqCtx.message?.text?.startsWith('/')) return;
          
          const text = reqCtx.message?.text?.trim();
          if (!text) return;
          
          this.logger.log(`Processing newrequest step ${requestData.step} with text: ${text}`);
          
          if (requestData.step === 1) {
            requestData.destination = text;
            requestData.step = 2;
            await reqCtx.reply('2️⃣ **Purpose**: What is the purpose of your trip?');
          } else if (requestData.step === 2) {
            requestData.purpose = text;
            requestData.step = 3;
            await reqCtx.reply('3️⃣ **Departure Date & Time**: When do you need to leave? (Format: YYYY-MM-DD HH:MM)');
          } else if (requestData.step === 3) {
            // Parse date
            const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
            const match = text.match(dateRegex);
            
            if (!match) {
              await reqCtx.reply('❌ Invalid date format. Please use: YYYY-MM-DD HH:MM (e.g., 2025-07-20 14:30)');
              return;
            }
            
            const [, year, month, day, hour, minute] = match;
            const departureDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            
            if (departureDate <= new Date()) {
              await reqCtx.reply('❌ Departure time must be in the future.');
              return;
            }
            
            requestData.departureDateTime = departureDate;
            requestData.step = 4;
            await reqCtx.reply('4️⃣ **Return Date & Time**: When do you plan to return? (Format: YYYY-MM-DD HH:MM)');
          } else if (requestData.step === 4) {
            // Parse return date
            const dateRegex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
            const match = text.match(dateRegex);
            
            if (!match) {
              await reqCtx.reply('❌ Invalid date format. Please use: YYYY-MM-DD HH:MM (e.g., 2025-07-20 18:00)');
              return;
            }
            
            const [, year, month, day, hour, minute] = match;
            const returnDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            
            if (returnDate <= requestData.departureDateTime!) {
              await reqCtx.reply('❌ Return time must be after departure time.');
              return;
            }
            
            requestData.returnDateTime = returnDate;
            requestData.step = 5;
            await reqCtx.reply('5️⃣ **Priority**: What is the priority of this request?\n\n1 - Low\n2 - Medium\n3 - High\n4 - Urgent\n\nPlease enter a number (1-4):');
          } else if (requestData.step === 5) {
            const priority = parseInt(text);
            if (priority < 1 || priority > 4) {
              await reqCtx.reply('❌ Please enter a valid priority number (1-4).');
              return;
            }
            
            const priorityMap = {
              1: RequestPriority.LOW,
              2: RequestPriority.MEDIUM,
              3: RequestPriority.HIGH,
              4: RequestPriority.URGENT
            };
            
            requestData.priority = priorityMap[priority];
            
            // Create the request
            try {
              const createRequestDto = {
                destination: requestData.destination!,
                purpose: requestData.purpose!,
                departureDateTime: requestData.departureDateTime!,
                returnDateTime: requestData.returnDateTime!,
                priority: requestData.priority!,
                passengerCount: 1 // Default to 1
              };
              
              const newRequest = await this.requestsService.create(user.id, createRequestDto);
              
              await reqCtx.reply(
                `✅ **Request Created Successfully!**\n\n` +
                `🆔 Request ID: ${newRequest.id.substring(0, 8)}...\n` +
                `📍 Destination: ${requestData.destination}\n` +
                `🎯 Purpose: ${requestData.purpose}\n` +
                `🕐 Departure: ${requestData.departureDateTime!.toLocaleString()}\n` +
                `🕐 Return: ${requestData.returnDateTime!.toLocaleString()}\n` +
                `⚡ Priority: ${requestData.priority}\n\n` +
                `Your request has been submitted and is now under review. You will receive notifications about status updates.`
              );
              
              isRequestListening = false;
            } catch (error) {
              this.logger.error(`Error creating request: ${error.message}`);
              await reqCtx.reply('❌ An error occurred while creating your request. Please try again later.');
              isRequestListening = false;
            }
          }
        };
        
        this.bot.on('text', requestListener);
        
        // Remove listener after 10 minutes
        setTimeout(() => {
          isRequestListening = false;
        }, 600000);
        
      } catch (error) {
        this.logger.error(`Error in newrequest command: ${error.message}`);
        await ctx.reply('❌ An error occurred. Please try again later.');
      }
    });

    // My requests command
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
        
        for (const request of requests.slice(0, 5)) { // Show last 5 requests
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
      } catch (error) {
        this.logger.error(`Error fetching requests: ${error.message}`);
        await ctx.reply('❌ An error occurred while fetching your requests. Please try again later.');
      }
    });

    // Approvals command - now shows user's request status instead of permission error
    this.bot.command('approvals', async (ctx) => {
      try {
        const user = await this.usersService.findByTelegramId(ctx.from.id.toString());
        if (!user) {
          await ctx.reply('❌ Your Telegram account is not linked to FleetMate. Please use /link first.');
          return;
        }
        
        // If user is an approver/admin/authority, show pending approvals
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
        } else {
          // For regular users, show their own request status
          const requests = await this.requestsService.findByUser(user.id);
          const pendingRequests = requests.filter(r => 
            r.status === 'submitted' || 
            r.status === 'under_review' || 
            r.status === 'eligible'
          );
          
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
      } catch (error) {
        this.logger.error(`Error fetching approvals: ${error.message}`);
        await ctx.reply('❌ An error occurred while fetching approvals. Please try again later.');
      }
    });

    this.bot.on('text', (ctx) => this.handleTextMessage(ctx));
  }

  private async handleTextMessage(ctx: any) {
    const userId = ctx.from.id;
    const state = this.userState.get(userId);

    if (state) {
      switch (state.command) {
        case 'link':
          await this.handleLinkConversation(ctx, userId, state);
          break;
        // case 'newrequest':
        //   await this.handleNewRequestConversation(ctx, userId, state);
        //   break;
      }
    } else {
      if (ctx.message.text.startsWith('/') && !this.isKnownCommand(ctx.message.text)) {
        await ctx.reply('❌ Unknown command. Type /help to see all available commands.');
      }
    }
  }

  private async handleLinkConversation(ctx: any, userId: number, state: any) {
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
  
  private isKnownCommand(text: string): boolean {
    const knownCommands = ['/start', '/help', '/link', '/myrequests', '/newrequest', '/approvals'];
    const command = text.split(' ')[0]; // Get just the command part
    return knownCommands.includes(command);
  }
  
  private getStatusEmoji(status: string): string {
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
}
