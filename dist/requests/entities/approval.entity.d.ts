import { User } from '../../users/entities/user.entity';
import { CarRequest } from './car-request.entity';
export declare enum ApprovalType {
    ELIGIBILITY_CHECK = "eligibility_check",
    FINAL_APPROVAL = "final_approval"
}
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Approval {
    id: string;
    requestId: string;
    request: CarRequest;
    approverId: string;
    approver: User;
    type: ApprovalType;
    status: ApprovalStatus;
    comments: string;
    createdAt: Date;
    approvedAt: Date;
}
