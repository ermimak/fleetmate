import { Injectable } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { NotificationGateway } from './notification.gateway';
import { CarRequest } from '../requests/entities/car-request.entity';
import { Approval } from '../requests/entities/approval.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private telegramService: TelegramService,
    private usersService: UsersService,
    private notificationGateway: NotificationGateway,
  ) {}

  async notifyNewRequest(request: CarRequest): Promise<void> {
    // Get user details
    const user = await this.usersService.findOne(request.userId);
    
    // Notify managers via WebSocket
    this.notificationGateway.sendNotificationToRole('authority', {
      type: 'new_request',
      message: `New car request from ${user.firstName} ${user.lastName}`,
      data: {
        requestId: request.id,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        destination: request.destination,
        departureDateTime: request.departureDateTime,
      },
    });
    
    // Notify user via Telegram if they have a Telegram ID
    if (user.telegramId) {
      await this.telegramService.sendMessage(
        user.telegramId,
        `✅ Your car request has been submitted successfully!\n\nDestination: ${request.destination}\nDeparture: ${new Date(request.departureDateTime).toLocaleString()}\nPassengers: ${request.passengerCount}\n\nYour request is now awaiting review.`
      );
    }
  }

  async notifyRequestStatusChange(request: CarRequest): Promise<void> {
    // Get user details
    const user = await this.usersService.findOne(request.userId);
    
    // Prepare status message
    let statusMessage = '';
    switch (request.status) {
      case 'eligible':
        statusMessage = 'Your request has been marked as eligible and is awaiting final approval.';
        break;
      case 'ineligible':
        statusMessage = `Your request has been marked as ineligible. Reason: ${request.rejectionReason || 'Not specified'}`;
        break;
      case 'approved':
        statusMessage = 'Your request has been approved! A car will be assigned soon.';
        break;
      case 'rejected':
        statusMessage = `Your request has been rejected. Reason: ${request.rejectionReason || 'Not specified'}`;
        break;
      case 'cancelled':
        statusMessage = `Your request has been cancelled. Reason: ${request.rejectionReason || 'Not specified'}`;
        break;
      case 'completed':
        statusMessage = 'Your trip has been marked as completed.';
        break;
      default:
        statusMessage = `Your request status has been updated to: ${request.status}`;
    }
    
    // Notify user via WebSocket
    this.notificationGateway.sendNotificationToUser(user.id, {
      type: 'request_status_change',
      message: statusMessage,
      data: {
        requestId: request.id,
        status: request.status,
        reason: request.rejectionReason,
      },
    });
    
    // Notify user via Telegram if they have a Telegram ID
    if (user.telegramId) {
      await this.telegramService.sendMessage(
        user.telegramId,
        `🔔 Request Status Update\n\nDestination: ${request.destination}\nStatus: ${request.status.toUpperCase()}\n\n${statusMessage}`
      );
    }
  }

  async notifyCarAssigned(request: CarRequest): Promise<void> {
    // Get user details
    const user = await this.usersService.findOne(request.userId);
    
    // Prepare car and driver details
    const carDetails = request.assignedCar ? 
      `${request.assignedCar.make} ${request.assignedCar.model} (${request.assignedCar.plateNumber})` : 
      'Not specified';
    
    const driverDetails = request.assignedDriver ? 
      `${request.assignedDriver.firstName} ${request.assignedDriver.lastName} (${request.assignedDriver.phoneNumber})` : 
      'Not specified';
    
    // Notify user via WebSocket
    this.notificationGateway.sendNotificationToUser(user.id, {
      type: 'car_assigned',
      message: `A car has been assigned to your request for ${request.destination}`,
      data: {
        requestId: request.id,
        car: carDetails,
        driver: driverDetails,
        departureDateTime: request.departureDateTime,
      },
    });
    
    // Notify user via Telegram if they have a Telegram ID
    if (user.telegramId) {
      await this.telegramService.sendMessage(
        user.telegramId,
        `🚗 Car Assigned!\n\nDestination: ${request.destination}\nDeparture: ${new Date(request.departureDateTime).toLocaleString()}\n\nCar: ${carDetails}\nDriver: ${driverDetails}\n\nHave a safe trip!`
      );
    }
  }

  async notifyApprovalAssigned(approval: Approval): Promise<void> {
    // Get approver details
    const approver = await this.usersService.findOne(approval.approverId);
    
    // Notify approver via WebSocket
    this.notificationGateway.sendNotificationToUser(approver.id, {
      type: 'approval_assigned',
      message: `You have a new ${approval.type} request to review`,
      data: {
        approvalId: approval.id,
        requestId: approval.requestId,
        type: approval.type,
      },
    });
    
    // Notify approver via Telegram if they have a Telegram ID
    if (approver.telegramId) {
      await this.telegramService.sendMessage(
        approver.telegramId,
        `📋 New Approval Task\n\nYou have been assigned to review a car request (${approval.type.replace('_', ' ')}).\n\nPlease log in to the FleetMate dashboard to review the request.`
      );
    }
  }

  async notifyApprovalDecision(approval: Approval, isApproved: boolean): Promise<void> {
    // Get request details
    const request = approval.request;
    const user = await this.usersService.findOne(request.userId);
    
    // Prepare message
    const approvalType = approval.type === 'eligibility_check' ? 'Eligibility Check' : 'Final Approval';
    const decision = isApproved ? 'approved' : 'rejected';
    const message = `Your request for ${request.destination} has ${decision} the ${approvalType} stage.`;
    
    // Notify user via WebSocket
    this.notificationGateway.sendNotificationToUser(user.id, {
      type: 'approval_decision',
      message,
      data: {
        requestId: request.id,
        approvalId: approval.id,
        type: approval.type,
        approved: isApproved,
        comments: approval.comments,
      },
    });
    
    // No need to send Telegram message here as the request status change will trigger a separate notification
  }

  async sendGeneralNotification(userId: string, title: string, message: string): Promise<void> {
    // Get user details
    const user = await this.usersService.findOne(userId);
    
    // Notify user via WebSocket
    this.notificationGateway.sendNotificationToUser(user.id, {
      type: 'general',
      message: title,
      data: {
        title,
        message,
      },
    });
    
    // Notify user via Telegram if they have a Telegram ID
    if (user.telegramId) {
      await this.telegramService.sendMessage(
        user.telegramId,
        `📢 ${title}\n\n${message}`
      );
    }
  }

  async broadcastNotification(title: string, message: string, roles?: string[]): Promise<void> {
    const notification = {
      type: 'broadcast',
      message: title,
      data: {
        title,
        message,
      },
    };

    if (roles && roles.length > 0) {
      // Send to specific roles
      for (const role of roles) {
        this.notificationGateway.sendNotificationToRole(role, notification);
      }

      // Also send via Telegram to users with these roles who have telegramId
      for (const role of roles) {
        const users = await this.usersService.findByRole(role as any);
        for (const user of users) {
          if (user.telegramId) {
            await this.telegramService.sendMessage(
              user.telegramId,
              `📢 ${title}\n\n${message}`
            );
          }
        }
      }
    } else {
      // Broadcast to all users via WebSocket
      this.notificationGateway.sendBroadcastNotification(notification);
      
      // Send to all users with telegramId via Telegram
      const users = await this.usersService.findAll();
      for (const user of users) {
        if (user.telegramId) {
          await this.telegramService.sendMessage(
            user.telegramId,
            `📢 ${title}\n\n${message}`
          );
        }
      }
    }
  }
}
