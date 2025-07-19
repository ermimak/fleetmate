import { Repository } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { CarRequest } from './entities/car-request.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
export declare class ApprovalsService {
    private approvalRepository;
    private requestRepository;
    private notificationsService;
    private usersService;
    constructor(approvalRepository: Repository<Approval>, requestRepository: Repository<CarRequest>, notificationsService: NotificationsService, usersService: UsersService);
    createApproval(createApprovalDto: CreateApprovalDto): Promise<Approval>;
    findAll(): Promise<Approval[]>;
    findByRequest(requestId: string): Promise<Approval[]>;
    findByApprover(approverId: string): Promise<Approval[]>;
    findPendingByApprover(approverId: string): Promise<Approval[]>;
    findOne(id: string): Promise<Approval>;
    approve(id: string, comments?: string): Promise<Approval>;
    reject(id: string, comments: string): Promise<Approval>;
    private createFinalApproval;
}
