import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { DatabaseSeeder } from './database.seeder';
import { User } from '../../users/entities/user.entity';
import { Car } from '../../cars/entities/car.entity';
import { Driver } from '../../cars/entities/driver.entity';
import { CarRequest } from '../../requests/entities/car-request.entity';
import { Approval } from '../../requests/entities/approval.entity';
import { DatabaseConfig } from '../../config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    TypeOrmModule.forFeature([
      User,
      Car,
      Driver,
      CarRequest,
      Approval,
    ]),
  ],
  providers: [DatabaseSeeder],
  exports: [DatabaseSeeder],
})
export class SeederModule {}
