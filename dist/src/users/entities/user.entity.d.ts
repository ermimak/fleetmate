import { CarRequest } from '../../requests/entities/car-request.entity';
import { Approval } from '../../requests/entities/approval.entity';
import { Department } from '../../departments/entities/department.entity';
export declare enum UserRole {
    USER = "user",
    AUTHORITY = "authority",
    APPROVER = "approver",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department: Department;
    position: string;
    phoneNumber: string;
    telegramId: string;
    telegramUsername: string;
    role: UserRole;
    status: UserStatus;
    manager: User;
    managerId: string;
    managedUsers: User[];
    createdAt: Date;
    updatedAt: Date;
    requests: CarRequest[];
    approvals: Approval[];
    get fullName(): string;
}
