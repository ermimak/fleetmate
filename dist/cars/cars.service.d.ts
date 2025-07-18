import { Repository } from 'typeorm';
import { Car, CarStatus, CarType } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
export declare class CarsService {
    private carRepository;
    constructor(carRepository: Repository<Car>);
    create(createCarDto: CreateCarDto): Promise<Car>;
    findAll(): Promise<Car[]>;
    findAvailable(passengerCount?: number, type?: CarType): Promise<Car[]>;
    findOne(id: string): Promise<Car>;
    findByPlateNumber(plateNumber: string): Promise<Car>;
    update(id: string, updateCarDto: UpdateCarDto): Promise<Car>;
    updateStatus(id: string, status: CarStatus): Promise<Car>;
    assignDriver(carId: string, driverId: string): Promise<Car>;
    unassignDriver(carId: string): Promise<Car>;
    remove(id: string): Promise<void>;
    getCarStats(): Promise<{
        totalCars: number;
        availableCars: number;
        inUseCars: number;
        maintenanceCars: number;
        carsByType: any[];
    }>;
    getCarsNeedingMaintenance(): Promise<Car[]>;
}
