import { CarRequest } from '../../requests/entities/car-request.entity';
import { Driver } from './driver.entity';
export declare enum CarStatus {
    AVAILABLE = "available",
    IN_USE = "in_use",
    MAINTENANCE = "maintenance",
    OUT_OF_SERVICE = "out_of_service"
}
export declare enum CarType {
    SEDAN = "sedan",
    SUV = "suv",
    VAN = "van",
    TRUCK = "truck",
    BUS = "bus"
}
export declare class Car {
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    type: CarType;
    capacity: number;
    status: CarStatus;
    currentDriverId: string;
    currentDriver: Driver;
    notes: string;
    lastMaintenanceDate: Date;
    nextMaintenanceDate: Date;
    mileage: number;
    createdAt: Date;
    updatedAt: Date;
    requests: CarRequest[];
    get displayName(): string;
}
