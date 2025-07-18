import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { NotificationsService } from './notifications.service';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  async sendNotification(
    @Body() body: { userId: string; title: string; message: string },
  ) {
    await this.notificationsService.sendGeneralNotification(
      body.userId,
      body.title,
      body.message,
    );
    return { success: true };
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  async broadcastNotification(
    @Body() body: { title: string; message: string; roles?: string[] },
  ) {
    await this.notificationsService.broadcastNotification(
      body.title,
      body.message,
      body.roles
    );
    
    return { success: true };
  }

  @Get('test-connection')
  async testConnection(@Request() req) {
    // This endpoint can be used to test if the WebSocket connection is working
    return { success: true, userId: req.user.userId };
  }
}
