import { UserRole } from '../../users/entities/user.entity';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    departmentId: string;
    position: string;
    phoneNumber?: string;
    role?: UserRole;
    managerId?: string;
}
