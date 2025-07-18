import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('approvals')
@UseGuards(AuthGuard('jwt'))
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  create(@Body() createApprovalDto: CreateApprovalDto) {
    return this.approvalsService.createApproval(createApprovalDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  findAll() {
    return this.approvalsService.findAll();
  }

  @Get('my-approvals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  findMyApprovals(@Request() req) {
    return this.approvalsService.findByApprover(req.user.userId);
  }

  @Get('my-pending-approvals')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  findMyPendingApprovals(@Request() req) {
    return this.approvalsService.findPendingByApprover(req.user.userId);
  }

  @Get('request/:requestId')
  findByRequest(@Param('requestId') requestId: string) {
    return this.approvalsService.findByRequest(requestId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.approvalsService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  approve(@Param('id') id: string, @Body('comments') comments?: string) {
    return this.approvalsService.approve(id, comments);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  reject(@Param('id') id: string, @Body('comments') comments: string) {
    return this.approvalsService.reject(id, comments);
  }
}
