import { Repository } from 'typeorm';
import { Driver, DriverStatus } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
export declare class DriversService {
    private driverRepository;
    constructor(driverRepository: Repository<Driver>);
    create(createDriverDto: CreateDriverDto): Promise<Driver>;
    findAll(): Promise<Driver[]>;
    findAvailable(): Promise<Driver[]>;
    findOne(id: string): Promise<Driver>;
    findByLicenseNumber(licenseNumber: string): Promise<Driver>;
    update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver>;
    updateStatus(id: string, status: DriverStatus): Promise<Driver>;
    remove(id: string): Promise<void>;
    getDriverStats(): Promise<{
        totalDrivers: number;
        availableDrivers: number;
        assignedDrivers: number;
    }>;
    getDriversWithExpiringLicenses(days?: number): Promise<Driver[]>;
}
