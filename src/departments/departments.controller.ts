import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('departments')
@UseGuards(AuthGuard('jwt'))
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Post(':id/assign-authority')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  assignAuthority(@Param('id') id: string, @Body('authorityId') authorityId: string) {
    return this.departmentsService.assignAuthority(id, authorityId);
  }

  @Get(':id/users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AUTHORITY)
  getUsersByDepartment(@Param('id') id: string) {
    return this.departmentsService.getUsersByDepartment(id);
  }

  @Post('assign-user')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  assignUserToDepartment(@Body('userId') userId: string, @Body('departmentId') departmentId: string) {
    return this.departmentsService.assignUserToDepartment(userId, departmentId);
  }
}
