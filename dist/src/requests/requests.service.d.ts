import { Repository } from 'typeorm';
import { CarRequest, RequestStatus } from './entities/car-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CarsService } from '../cars/cars.service';
import { DriversService } from '../cars/drivers.service';
import { UsersService } from '../users/users.service';
import { ApprovalsService } from './approvals.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class RequestsService {
    private requestRepository;
    private carsService;
    private driversService;
    private usersService;
    private approvalsService;
    private notificationsService;
    constructor(requestRepository: Repository<CarRequest>, carsService: CarsService, driversService: DriversService, usersService: UsersService, approvalsService: ApprovalsService, notificationsService: NotificationsService);
    create(userId: string, createRequestDto: CreateRequestDto): Promise<CarRequest>;
    findAll(filters?: any): Promise<CarRequest[]>;
    findOne(id: string): Promise<CarRequest>;
    findByUser(userId: string): Promise<CarRequest[]>;
    findPendingApprovals(approverId: string): Promise<CarRequest[]>;
    update(id: string, updateRequestDto: UpdateRequestDto): Promise<CarRequest>;
    updateStatus(id: string, status: RequestStatus, reason?: string): Promise<CarRequest>;
    assignCar(id: string, carId: string, driverId: string): Promise<CarRequest>;
    startTrip(id: string): Promise<CarRequest>;
    completeTrip(id: string, totalDistance: number, tripNotes?: string): Promise<CarRequest>;
    cancelRequest(id: string, reason: string): Promise<CarRequest>;
    getRequestStats(): Promise<{
        totalRequests: number;
        pendingRequests: number;
        approvedRequests: number;
        completedRequests: number;
        rejectedRequests: number;
        requestsByPriority: any[];
    }>;
    getOverdueRequests(): Promise<CarRequest[]>;
}
