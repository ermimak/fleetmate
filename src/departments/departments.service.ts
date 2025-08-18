import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    // Check if department name already exists
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name }
    });

    if (existingDepartment) {
      throw new BadRequestException('Department with this name already exists');
    }

    // Validate authority user if provided
    if (createDepartmentDto.authorityId) {
      const authority = await this.userRepository.findOne({
        where: { id: createDepartmentDto.authorityId }
      });
      
      if (!authority) {
        throw new NotFoundException('Authority user not found');
      }
    }

    const department = this.departmentRepository.create(createDepartmentDto);
    return this.departmentRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find({
      relations: ['authority', 'users'],
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['authority', 'users']
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);

    // Check if new name conflicts with existing department
    if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { name: updateDepartmentDto.name }
      });

      if (existingDepartment) {
        throw new BadRequestException('Department with this name already exists');
      }
    }

    // Validate authority user if provided
    if (updateDepartmentDto.authorityId) {
      const authority = await this.userRepository.findOne({
        where: { id: updateDepartmentDto.authorityId }
      });
      
      if (!authority) {
        throw new NotFoundException('Authority user not found');
      }
    }

    await this.departmentRepository.update(id, updateDepartmentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    
    // Check if department has users
    const userCount = await this.userRepository.count({
      where: { department: department.name }
    });

    if (userCount > 0) {
      throw new BadRequestException('Cannot delete department with assigned users. Please reassign users first.');
    }

    await this.departmentRepository.remove(department);
  }

  async assignAuthority(departmentId: string, authorityId: string): Promise<Department> {
    const department = await this.findOne(departmentId);
    const authority = await this.userRepository.findOne({
      where: { id: authorityId }
    });

    if (!authority) {
      throw new NotFoundException('Authority user not found');
    }

    department.authorityId = authorityId;
    return this.departmentRepository.save(department);
  }

  async getUsersByDepartment(departmentId: string): Promise<User[]> {
    const department = await this.findOne(departmentId);
    return this.userRepository.find({
      where: { department: department.name },
      order: { firstName: 'ASC' }
    });
  }

  async assignUserToDepartment(userId: string, departmentId: string): Promise<User> {
    const department = await this.findOne(departmentId);
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.department = department.name;
    return this.userRepository.save(user);
  }
}
