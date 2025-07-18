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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const telegram_service_1 = require("../telegram/telegram.service");
const users_service_1 = require("../users/users.service");
const notification_gateway_1 = require("./notification.gateway");
let NotificationsService = class NotificationsService {
    constructor(telegramService, usersService, notificationGateway) {
        this.telegramService = telegramService;
        this.usersService = usersService;
        this.notificationGateway = notificationGateway;
    }
    async notifyNewRequest(request) {
        const user = await this.usersService.findOne(request.userId);
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
        if (user.telegramId) {
            await this.telegramService.sendMessage(user.telegramId, `✅ Your car request has been submitted successfully!\n\nDestination: ${request.destination}\nDeparture: ${new Date(request.departureDateTime).toLocaleString()}\nPassengers: ${request.passengerCount}\n\nYour request is now awaiting review.`);
        }
    }
    async notifyRequestStatusChange(request) {
        const user = await this.usersService.findOne(request.userId);
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
        this.notificationGateway.sendNotificationToUser(user.id, {
            type: 'request_status_change',
            message: statusMessage,
            data: {
                requestId: request.id,
                status: request.status,
                reason: request.rejectionReason,
            },
        });
        if (user.telegramId) {
            await this.telegramService.sendMessage(user.telegramId, `🔔 Request Status Update\n\nDestination: ${request.destination}\nStatus: ${request.status.toUpperCase()}\n\n${statusMessage}`);
        }
    }
    async notifyCarAssigned(request) {
        const user = await this.usersService.findOne(request.userId);
        const carDetails = request.assignedCar ?
            `${request.assignedCar.make} ${request.assignedCar.model} (${request.assignedCar.plateNumber})` :
            'Not specified';
        const driverDetails = request.assignedDriver ?
            `${request.assignedDriver.firstName} ${request.assignedDriver.lastName} (${request.assignedDriver.phoneNumber})` :
            'Not specified';
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
        if (user.telegramId) {
            await this.telegramService.sendMessage(user.telegramId, `🚗 Car Assigned!\n\nDestination: ${request.destination}\nDeparture: ${new Date(request.departureDateTime).toLocaleString()}\n\nCar: ${carDetails}\nDriver: ${driverDetails}\n\nHave a safe trip!`);
        }
    }
    async notifyApprovalAssigned(approval) {
        const approver = await this.usersService.findOne(approval.approverId);
        this.notificationGateway.sendNotificationToUser(approver.id, {
            type: 'approval_assigned',
            message: `You have a new ${approval.type} request to review`,
            data: {
                approvalId: approval.id,
                requestId: approval.requestId,
                type: approval.type,
            },
        });
        if (approver.telegramId) {
            await this.telegramService.sendMessage(approver.telegramId, `📋 New Approval Task\n\nYou have been assigned to review a car request (${approval.type.replace('_', ' ')}).\n\nPlease log in to the FleetMate dashboard to review the request.`);
        }
    }
    async notifyApprovalDecision(approval, isApproved) {
        const request = approval.request;
        const user = await this.usersService.findOne(request.userId);
        const approvalType = approval.type === 'eligibility_check' ? 'Eligibility Check' : 'Final Approval';
        const decision = isApproved ? 'approved' : 'rejected';
        const message = `Your request for ${request.destination} has ${decision} the ${approvalType} stage.`;
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
    }
    async sendGeneralNotification(userId, title, message) {
        const user = await this.usersService.findOne(userId);
        this.notificationGateway.sendNotificationToUser(user.id, {
            type: 'general',
            message: title,
            data: {
                title,
                message,
            },
        });
        if (user.telegramId) {
            await this.telegramService.sendMessage(user.telegramId, `📢 ${title}\n\n${message}`);
        }
    }
    async broadcastNotification(title, message, roles) {
        const notification = {
            type: 'broadcast',
            message: title,
            data: {
                title,
                message,
            },
        };
        if (roles && roles.length > 0) {
            for (const role of roles) {
                this.notificationGateway.sendNotificationToRole(role, notification);
            }
            for (const role of roles) {
                const users = await this.usersService.findByRole(role);
                for (const user of users) {
                    if (user.telegramId) {
                        await this.telegramService.sendMessage(user.telegramId, `📢 ${title}\n\n${message}`);
                    }
                }
            }
        }
        else {
            this.notificationGateway.sendBroadcastNotification(notification);
            const users = await this.usersService.findAll();
            for (const user of users) {
                if (user.telegramId) {
                    await this.telegramService.sendMessage(user.telegramId, `📢 ${title}\n\n${message}`);
                }
            }
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService,
        users_service_1.UsersService,
        notification_gateway_1.NotificationGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map