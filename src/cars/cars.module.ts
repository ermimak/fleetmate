import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Car } from './entities/car.entity';
import { Driver } from './entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Car, Driver])],
  providers: [CarsService, DriversService],
  controllers: [CarsController, DriversController],
  exports: [CarsService, DriversService],
})
export class CarsModule {}
