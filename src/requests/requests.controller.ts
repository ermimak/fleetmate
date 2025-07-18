import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestStatus } from './entities/car-request.entity';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('requests')
@UseGuards(AuthGuard('jwt'))
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@Request() req, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.userId, createRequestDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: RequestStatus,
    @Query('priority') priority?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.requestsService.findAll({ userId, status, priority, startDate, endDate });
  }

  @Get('my-requests')
  findMyRequests(@Request() req) {
    return this.requestsService.findByUser(req.user.userId);
  }

  @Get('pending-approvals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  findPendingApprovals(@Request() req) {
    return this.requestsService.findPendingApprovals(req.user.userId);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  getStats() {
    return this.requestsService.getRequestStats();
  }

  @Get('overdue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  getOverdueRequests() {
    return this.requestsService.getOverdueRequests();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto, @Request() req) {
    // In a real app, check if the user is the owner of the request or an admin
    return this.requestsService.update(id, updateRequestDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RequestStatus,
    @Body('reason') reason?: string,
  ) {
    return this.requestsService.updateStatus(id, status, reason);
  }

  @Patch(':id/assign-car')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  assignCar(
    @Param('id') id: string,
    @Body('carId') carId: string,
    @Body('driverId') driverId: string,
  ) {
    return this.requestsService.assignCar(id, carId, driverId);
  }

  @Patch(':id/start-trip')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  startTrip(@Param('id') id: string) {
    return this.requestsService.startTrip(id);
  }

  @Patch(':id/complete-trip')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  completeTrip(
    @Param('id') id: string,
    @Body('totalDistance') totalDistance: number,
    @Body('tripNotes') tripNotes?: string,
  ) {
    return this.requestsService.completeTrip(id, totalDistance, tripNotes);
  }

  @Patch(':id/cancel')
  cancelRequest(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    // In a real app, check if the user is the owner of the request or an admin
    return this.requestsService.cancelRequest(id, reason);
  }
}
