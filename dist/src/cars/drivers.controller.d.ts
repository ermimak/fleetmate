import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverStatus } from './entities/driver.entity';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    create(createDriverDto: CreateDriverDto): Promise<import("./entities/driver.entity").Driver>;
    findAll(): Promise<import("./entities/driver.entity").Driver[]>;
    findAvailable(): Promise<import("./entities/driver.entity").Driver[]>;
    getStats(): Promise<{
        totalDrivers: number;
        availableDrivers: number;
        assignedDrivers: number;
    }>;
    getDriversWithExpiringLicenses(days?: number): Promise<import("./entities/driver.entity").Driver[]>;
    findOne(id: string): Promise<import("./entities/driver.entity").Driver>;
    update(id: string, updateDriverDto: UpdateDriverDto): Promise<import("./entities/driver.entity").Driver>;
    updateStatus(id: string, status: DriverStatus): Promise<import("./entities/driver.entity").Driver>;
    remove(id: string): Promise<void>;
}
