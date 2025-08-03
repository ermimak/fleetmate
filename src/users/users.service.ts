import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'role', 'status', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'phoneNumber', 'role', 'status', 'managerId', 'telegramId', 'telegramUsername', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    return this.userRepository.findOne({ where: { telegramId } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role },
      select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'role', 'status'],
    });
  }

  async findByDepartment(department: string): Promise<User[]> {
    return this.userRepository.find({
      where: { department },
      select: ['id', 'email', 'firstName', 'lastName', 'department', 'position', 'role', 'status'],
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
