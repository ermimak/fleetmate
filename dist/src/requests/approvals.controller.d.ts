import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    create(createApprovalDto: CreateApprovalDto): Promise<import("./entities/approval.entity").Approval>;
    findAll(): Promise<import("./entities/approval.entity").Approval[]>;
    findMyApprovals(req: any): Promise<import("./entities/approval.entity").Approval[]>;
    findMyPendingApprovals(req: any): Promise<import("./entities/approval.entity").Approval[]>;
    findByRequest(requestId: string): Promise<import("./entities/approval.entity").Approval[]>;
    findOne(id: string): Promise<import("./entities/approval.entity").Approval>;
    approve(id: string, comments?: string): Promise<import("./entities/approval.entity").Approval>;
    reject(id: string, comments: string): Promise<import("./entities/approval.entity").Approval>;
}
