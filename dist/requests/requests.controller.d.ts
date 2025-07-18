import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestStatus } from './entities/car-request.entity';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    create(req: any, createRequestDto: CreateRequestDto): Promise<import("./entities/car-request.entity").CarRequest>;
    findAll(userId?: string, status?: RequestStatus, priority?: string, startDate?: Date, endDate?: Date): Promise<import("./entities/car-request.entity").CarRequest[]>;
    findMyRequests(req: any): Promise<import("./entities/car-request.entity").CarRequest[]>;
    findPendingApprovals(req: any): Promise<import("./entities/car-request.entity").CarRequest[]>;
    getStats(): Promise<{
        totalRequests: number;
        pendingRequests: number;
        approvedRequests: number;
        completedRequests: number;
        rejectedRequests: number;
        requestsByPriority: any[];
    }>;
    getOverdueRequests(): Promise<import("./entities/car-request.entity").CarRequest[]>;
    findOne(id: string): Promise<import("./entities/car-request.entity").CarRequest>;
    update(id: string, updateRequestDto: UpdateRequestDto, req: any): Promise<import("./entities/car-request.entity").CarRequest>;
    updateStatus(id: string, status: RequestStatus, reason?: string): Promise<import("./entities/car-request.entity").CarRequest>;
    assignCar(id: string, carId: string, driverId: string): Promise<import("./entities/car-request.entity").CarRequest>;
    startTrip(id: string): Promise<import("./entities/car-request.entity").CarRequest>;
    completeTrip(id: string, totalDistance: number, tripNotes?: string): Promise<import("./entities/car-request.entity").CarRequest>;
    cancelRequest(id: string, reason: string, req: any): Promise<import("./entities/car-request.entity").CarRequest>;
}
