import { CarType } from '../entities/car.entity';
export declare class CreateCarDto {
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    type: CarType;
    capacity: number;
    notes?: string;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    mileage?: number;
}
