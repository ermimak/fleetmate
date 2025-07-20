import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LinkTelegramDto } from './dto/link-telegram.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
        department: import("../departments/entities/department.entity").Department;
        position: string;
        phoneNumber: string;
        telegramId: string;
        telegramUsername: string;
        role: import("../users/entities/user.entity").UserRole;
        status: import("../users/entities/user.entity").UserStatus;
        manager: import("../users/entities/user.entity").User;
        managerId: string;
        managedUsers: import("../users/entities/user.entity").User[];
        createdAt: Date;
        updatedAt: Date;
        requests: import("../requests/entities/car-request.entity").CarRequest[];
        approvals: import("../requests/entities/approval.entity").Approval[];
    }>;
    getProfile(req: any): any;
    linkTelegram(req: any, linkTelegramDto: LinkTelegramDto): Promise<import("../users/entities/user.entity").User>;
}
