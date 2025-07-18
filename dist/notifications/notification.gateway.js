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
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
let NotificationGateway = class NotificationGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('NotificationGateway');
        this.connectedClients = [];
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token?.split(' ')[1];
            if (!token) {
                this.logger.error('No token provided');
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            if (!payload) {
                this.logger.error('Invalid token');
                client.disconnect();
                return;
            }
            this.connectedClients.push({
                userId: payload.sub,
                role: payload.role,
                socketId: client.id,
            });
            this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
            client.join(`user-${payload.sub}`);
            client.join(`role-${payload.role}`);
        }
        catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.connectedClients = this.connectedClients.filter((c) => c.socketId !== client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribe(client, data) {
        if (data.requestId) {
            client.join(`request-${data.requestId}`);
            this.logger.log(`Client ${client.id} subscribed to request-${data.requestId}`);
        }
        return { event: 'subscribed', data: { success: true } };
    }
    handleUnsubscribe(client, data) {
        if (data.requestId) {
            client.leave(`request-${data.requestId}`);
            this.logger.log(`Client ${client.id} unsubscribed from request-${data.requestId}`);
        }
        return { event: 'unsubscribed', data: { success: true } };
    }
    sendNotificationToUser(userId, notification) {
        this.server.to(`user-${userId}`).emit('notification', notification);
        this.logger.log(`Notification sent to user ${userId}`);
    }
    sendNotificationToRole(role, notification) {
        this.server.to(`role-${role}`).emit('notification', notification);
        this.logger.log(`Notification sent to role ${role}`);
    }
    sendNotificationToRequest(requestId, notification) {
        this.server.to(`request-${requestId}`).emit('notification', notification);
        this.logger.log(`Notification sent to request ${requestId}`);
    }
    sendBroadcastNotification(notification) {
        this.server.emit('notification', notification);
        this.logger.log('Broadcast notification sent');
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Object)
], NotificationGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Object)
], NotificationGateway.prototype, "handleUnsubscribe", null);
exports.NotificationGateway = NotificationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:4200',
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map