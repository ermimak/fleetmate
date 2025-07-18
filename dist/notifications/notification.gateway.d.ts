import { OnGatewayConnection, OnGatewayDisconnect, WsResponse } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private logger;
    private connectedClients;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, data: {
        requestId?: string;
    }): WsResponse<any>;
    handleUnsubscribe(client: Socket, data: {
        requestId?: string;
    }): WsResponse<any>;
    sendNotificationToUser(userId: string, notification: any): void;
    sendNotificationToRole(role: string, notification: any): void;
    sendNotificationToRequest(requestId: string, notification: any): void;
    sendBroadcastNotification(notification: any): void;
}
