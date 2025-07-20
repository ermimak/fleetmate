import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DepartmentsService } from '../departments/departments.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private departmentsService: DepartmentsService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { departmentId, managerId, ...restOfDto } = createUserDto;

    const department = await this.departmentsService.findOne(departmentId);
    if (!department) {
      throw new BadRequestException(`Department with ID ${departmentId} not found`);
    }

    let manager: User | null = null;
    if (managerId) {
      manager = await this.findOne(managerId);
      if (!manager) {
        throw new BadRequestException(`Manager with ID ${managerId} not found`);
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...restOfDto,
      password: hashedPassword,
      department,
      manager,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['department', 'manager'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['department', 'manager', 'managedUsers'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email }, relations: ['department', 'manager'] });
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    return this.userRepository.findOne({ where: { telegramId }, relations: ['department', 'manager'] });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      relations: ['department'],
    });
  }

  async findByDepartment(departmentId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { department: { id: departmentId } },
      relations: ['department'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    await this.userRepository.update(id, { status });
    return this.findOne(id);
  }

  async updateTelegramInfo(id: string, telegramInfo: { telegramId: string; telegramUsername: string }): Promise<User> {
    await this.userRepository.update(id, telegramInfo);
    return this.findOne(id);
  }

  async getManagers(): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { role: UserRole.AUTHORITY },
        { role: UserRole.APPROVER },
        { role: UserRole.ADMIN },
      ],
      select: ['id', 'firstName', 'lastName', 'department', 'position', 'role'],
    });
  }

  async getUserStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return {
      totalUsers,
      activeUsers,
      usersByRole,
    };
  }
}
