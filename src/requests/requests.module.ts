import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';
import { CarRequest } from './entities/car-request.entity';
import { Approval } from './entities/approval.entity';
import { CarsModule } from '../cars/cars.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarRequest, Approval]),
    CarsModule,
    UsersModule,
    NotificationsModule,
  ],
  providers: [RequestsService, ApprovalsService],
  controllers: [RequestsController, ApprovalsController],
  exports: [RequestsService, ApprovalsService],
})
export class RequestsModule {}
