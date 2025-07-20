import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Approval {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comments: string | null;
    createdAt: Date;
    updatedAt: Date;
    approverId: string;
    requestId: string;
}
export interface CarRequest {
    id: string;
    destination: string;
    status: string;
    approvals: Approval[];
}
export declare class ApprovalsService {
    private http;
    private apiUrl;
    constructor(http: HttpClient);
    getPendingApprovals(): Observable<CarRequest[]>;
    approve(approvalId: string, comments?: string): Observable<any>;
    reject(approvalId: string, comments: string): Observable<any>;
}
