import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Car } from '../../cars/entities/car.entity';
import { Driver } from '../../cars/entities/driver.entity';
import { CarRequest } from '../../requests/entities/car-request.entity';
import { Approval } from '../../requests/entities/approval.entity';
export declare class DatabaseSeeder {
    private userRepository;
    private carRepository;
    private driverRepository;
    private requestRepository;
    private approvalRepository;
    constructor(userRepository: Repository<User>, carRepository: Repository<Car>, driverRepository: Repository<Driver>, requestRepository: Repository<CarRequest>, approvalRepository: Repository<Approval>);
    seed(): Promise<void>;
    private clearDatabase;
    private seedUsers;
    private seedDrivers;
    private seedCars;
    private seedRequests;
    private seedApprovals;
}
