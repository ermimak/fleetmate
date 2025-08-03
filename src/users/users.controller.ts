import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from './entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  findAll(@Query('role') role?: UserRole, @Query('department') department?: string) {
    if (role) {
      return this.usersService.findByRole(role);
    }
    if (department) {
      return this.usersService.findByDepartment(department);
    }
    return this.usersService.findAll();
  }

  @Get('managers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.APPROVER)
  getManagers() {
    return this.usersService.getManagers();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.usersService.getUserStats();
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY, UserRole.USER, UserRole.APPROVER)
  async getMe(@Request() req) {
    try {
      // The user object is attached to the request by the AuthGuard
      const user = await this.usersService.findOne(req.user.userId);
      if (!user) {
        throw new Error('User not found');
      }
      // Remove sensitive data before returning
      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error('Error in getMe:', error);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.usersService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
