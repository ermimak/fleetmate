import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    findByTelegramId(telegramId: string): Promise<User>;
    findByRole(role: UserRole): Promise<User[]>;
    findByDepartment(department: string): Promise<User[]>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    remove(id: string): Promise<void>;
    updateStatus(id: string, status: UserStatus): Promise<User>;
    updateTelegramInfo(id: string, telegramInfo: {
        telegramId: string;
        telegramUsername: string;
    }): Promise<User>;
    getManagers(): Promise<User[]>;
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        usersByRole: any[];
    }>;
}
