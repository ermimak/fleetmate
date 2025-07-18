import { Controller, Post, Body, UseGuards, Request, Param, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramBotService: TelegramBotService,
    private readonly usersService: UsersService,
  ) {}

  @Get('status')
  async getStatus() {
    return {
      success: true,
      message: 'Telegram bot service is running',
      botInitialized: !!this.telegramService.getBot(),
      timestamp: new Date().toISOString()
    };
  }

  @Post('webhook')
  async webhook(@Body() update: any) {
    // Handle Telegram webhook updates
    // This endpoint would be registered with Telegram's API
    // In production, this should validate the request is from Telegram
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('send-message')
  async sendMessage(
    @Request() req,
    @Body() body: { message: string },
  ) {
    const user = await this.usersService.findOne(req.user.userId);
    
    if (!user.telegramId) {
      return { success: false, message: 'Your account is not linked with Telegram' };
    }
    
    await this.telegramService.sendMessage(user.telegramId, body.message);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('send-notification/:userId')
  async sendNotification(
    @Param('userId') userId: string,
    @Body() body: { title: string; message: string },
  ) {
    const user = await this.usersService.findOne(userId);
    
    if (!user.telegramId) {
      return { success: false, message: 'User account is not linked with Telegram' };
    }
    
    const message = `📢 ${body.title}\n\n${body.message}`;
    await this.telegramService.sendMessage(user.telegramId, message);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('broadcast')
  async broadcast(
    @Body() body: { title: string; message: string; roles?: string[] },
  ) {
    let users = [];
    
    if (body.roles && body.roles.length > 0) {
      // Fetch users for each role and combine them
      for (const roleStr of body.roles) {
        const role = roleStr as UserRole; // Cast string to UserRole enum
        const usersWithRole = await this.usersService.findByRole(role);
        users = [...users, ...usersWithRole];
      }
    } else {
      // If no roles specified, get all users
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
}
