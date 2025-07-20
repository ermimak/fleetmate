import { CarRequest } from '../../requests/entities/car-request.entity';
export declare enum DriverStatus {
    AVAILABLE = "available",
    ASSIGNED = "assigned",
    OFF_DUTY = "off_duty",
    ON_LEAVE = "on_leave"
}
export declare class Driver {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phoneNumber: string;
    email: string;
    licenseExpiryDate: Date;
    status: DriverStatus;
    notes: string;
    experienceYears: number;
    createdAt: Date;
    updatedAt: Date;
    requests: CarRequest[];
    get fullName(): string;
    get isLicenseValid(): boolean;
}
