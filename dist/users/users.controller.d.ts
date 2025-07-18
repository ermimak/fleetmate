import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, UserStatus } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    findAll(role?: UserRole, department?: string): Promise<import("./entities/user.entity").User[]>;
    getManagers(): Promise<import("./entities/user.entity").User[]>;
    getStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        usersByRole: any[];
    }>;
    findOne(id: string): Promise<import("./entities/user.entity").User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User>;
    updateStatus(id: string, status: UserStatus): Promise<import("./entities/user.entity").User>;
    remove(id: string): Promise<void>;
}
