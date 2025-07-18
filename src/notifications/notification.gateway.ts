import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  WsResponse,
  ConnectedSocket,
  MessageBody 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

interface ConnectedClient {
  userId: string;
  role: string;
  socketId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationGateway');
  private connectedClients: ConnectedClient[] = [];

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
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
      
      // Store connected client
      this.connectedClients.push({
        userId: payload.sub,
        role: payload.role,
        socketId: client.id,
      });
      
      this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
      
      // Join user-specific room
      client.join(`user-${payload.sub}`);
      
      // Join role-specific room
      client.join(`role-${payload.role}`);
      
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove client from connected clients
    this.connectedClients = this.connectedClients.filter(
      (c) => c.socketId !== client.id,
    );
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requestId?: string },
  ): WsResponse<any> {
    if (data.requestId) {
      client.join(`request-${data.requestId}`);
      this.logger.log(`Client ${client.id} subscribed to request-${data.requestId}`);
    }
    
    return { event: 'subscribed', data: { success: true } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { requestId?: string },
  ): WsResponse<any> {
    if (data.requestId) {
      client.leave(`request-${data.requestId}`);
      this.logger.log(`Client ${client.id} unsubscribed from request-${data.requestId}`);
    }
    
    return { event: 'unsubscribed', data: { success: true } };
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user-${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}`);
  }

  sendNotificationToRole(role: string, notification: any) {
    this.server.to(`role-${role}`).emit('notification', notification);
    this.logger.log(`Notification sent to role ${role}`);
  }

  sendNotificationToRequest(requestId: string, notification: any) {
    this.server.to(`request-${requestId}`).emit('notification', notification);
    this.logger.log(`Notification sent to request ${requestId}`);
  }

  sendBroadcastNotification(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Broadcast notification sent');
  }
}
