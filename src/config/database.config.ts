import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { CarRequest } from '../requests/entities/car-request.entity';
import { Car } from '../cars/entities/car.entity';
import { Driver } from '../cars/entities/driver.entity';
import { Approval } from '../requests/entities/approval.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'fleetmate_user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'fleetmate_db',
      entities: [User, CarRequest, Car, Driver, Approval],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      migrations: ['dist/migrations/*.js'],
      migrationsTableName: 'migrations',
    };
  }
}

// DataSource for migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'fleetmate_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'fleetmate_db',
  entities: [User, CarRequest, Car, Driver, Approval],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
