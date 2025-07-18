import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            department: any;
            position: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        department: string;
        position: string;
        phoneNumber: string;
        telegramId: string;
        telegramUsername: string;
        role: import("../users/entities/user.entity").UserRole;
        status: import("../users/entities/user.entity").UserStatus;
        managerId: string;
        createdAt: Date;
        updatedAt: Date;
        requests: import("../requests/entities/car-request.entity").CarRequest[];
        approvals: import("../requests/entities/approval.entity").Approval[];
    }>;
    findUserById(id: string): Promise<User>;
    linkTelegramAccount(userId: string, telegramId: string, telegramUsername?: string): Promise<User>;
}
