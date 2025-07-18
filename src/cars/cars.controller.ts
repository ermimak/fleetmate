import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarStatus, CarType } from './entities/car.entity';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('cars')
@UseGuards(AuthGuard('jwt'))
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  create(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  @Get()
  findAll() {
    return this.carsService.findAll();
  }

  @Get('available')
  findAvailable(
    @Query('passengerCount') passengerCount?: number,
    @Query('type') type?: CarType,
  ) {
    return this.carsService.findAvailable(passengerCount, type);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  getStats() {
    return this.carsService.getCarStats();
  }

  @Get('maintenance-needed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  getCarsNeedingMaintenance() {
    return this.carsService.getCarsNeedingMaintenance();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  update(@Param('id') id: string, @Body() updateCarDto: UpdateCarDto) {
    return this.carsService.update(id, updateCarDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  updateStatus(@Param('id') id: string, @Body('status') status: CarStatus) {
    return this.carsService.updateStatus(id, status);
  }

  @Patch(':id/assign-driver/:driverId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  assignDriver(@Param('id') id: string, @Param('driverId') driverId: string) {
    return this.carsService.assignDriver(id, driverId);
  }

  @Patch(':id/unassign-driver')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  unassignDriver(@Param('id') id: string) {
    return this.carsService.unassignDriver(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.carsService.remove(id);
  }
}
