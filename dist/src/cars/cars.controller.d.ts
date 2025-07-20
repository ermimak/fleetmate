import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarStatus, CarType } from './entities/car.entity';
export declare class CarsController {
    private readonly carsService;
    constructor(carsService: CarsService);
    create(createCarDto: CreateCarDto): Promise<import("./entities/car.entity").Car>;
    findAll(): Promise<import("./entities/car.entity").Car[]>;
    findAvailable(passengerCount?: number, type?: CarType): Promise<import("./entities/car.entity").Car[]>;
    getStats(): Promise<{
        totalCars: number;
        availableCars: number;
        inUseCars: number;
        maintenanceCars: number;
        carsByType: any[];
    }>;
    getCarsNeedingMaintenance(): Promise<import("./entities/car.entity").Car[]>;
    findOne(id: string): Promise<import("./entities/car.entity").Car>;
    update(id: string, updateCarDto: UpdateCarDto): Promise<import("./entities/car.entity").Car>;
    updateStatus(id: string, status: CarStatus): Promise<import("./entities/car.entity").Car>;
    assignDriver(id: string, driverId: string): Promise<import("./entities/car.entity").Car>;
    unassignDriver(id: string): Promise<import("./entities/car.entity").Car>;
    remove(id: string): Promise<void>;
}
