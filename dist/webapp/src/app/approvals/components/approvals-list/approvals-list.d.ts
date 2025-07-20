import { OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { ApprovalsService, CarRequest } from '../../services/approvals.service';
import { AuthService } from '../../../auth/auth.service';
import { WebSocketService } from '../../../notifications/websocket.service';
export declare class ApprovalsListComponent implements OnInit, OnDestroy {
    private approvalsService;
    private authService;
    private webSocketService;
    pendingApprovals$: Observable<CarRequest[]>;
    canPerformActions: boolean;
    private refresh$;
    private wsSubscription;
    private userSubscription;
    constructor(approvalsService: ApprovalsService, authService: AuthService, webSocketService: WebSocketService);
    ngOnInit(): void;
    ngOnDestroy(): void;
    refreshData(): void;
    approve(request: CarRequest): void;
    reject(request: CarRequest): void;
    private findPendingApproval;
}
