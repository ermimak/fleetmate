import { UserRole } from '../entities/user.entity';
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    departmentId: string;
    position: string;
    phoneNumber?: string;
    role?: UserRole;
    managerId?: string;
    telegramId?: string;
    telegramUsername?: string;
}
