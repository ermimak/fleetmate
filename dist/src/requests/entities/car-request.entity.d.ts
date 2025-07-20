import { User } from '../../users/entities/user.entity';
import { Car } from '../../cars/entities/car.entity';
import { Driver } from '../../cars/entities/driver.entity';
import { Approval } from './approval.entity';
export declare enum RequestStatus {
    SUBMITTED = "submitted",
    UNDER_REVIEW = "under_review",
    ELIGIBLE = "eligible",
    INELIGIBLE = "ineligible",
    APPROVED = "approved",
    REJECTED = "rejected",
    CAR_ASSIGNED = "car_assigned",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    PENDING_ELIGIBILITY = "PENDING_ELIGIBILITY",
    PENDING_APPROVAL = "PENDING_APPROVAL"
}
export declare enum RequestPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class CarRequest {
    id: string;
    userId: string;
    user: User;
    purpose: string;
    destination: string;
    departureDateTime: Date;
    returnDateTime: Date;
    passengerCount: number;
    priority: RequestPriority;
    status: RequestStatus;
    additionalNotes: string;
    assignedCarId: string;
    assignedCar: Car;
    assignedDriverId: string;
    assignedDriver: Driver;
    rejectionReason: string;
    actualDepartureTime: Date;
    actualReturnTime: Date;
    totalDistance: number;
    tripNotes: string;
    createdAt: Date;
    updatedAt: Date;
    approvals: Approval[];
    get isOverdue(): boolean;
    get duration(): number;
}
