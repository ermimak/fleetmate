"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsListComponent = void 0;
const core_1 = require("@angular/core");
const common_1 = require("@angular/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const approvals_service_1 = require("../../services/approvals.service");
const auth_service_1 = require("../../../auth/auth.service");
const websocket_service_1 = require("../../../notifications/websocket.service");
let ApprovalsListComponent = class ApprovalsListComponent {
    constructor(approvalsService, authService, webSocketService) {
        this.approvalsService = approvalsService;
        this.authService = authService;
        this.webSocketService = webSocketService;
        this.canPerformActions = false;
        this.refresh$ = new rxjs_1.Subject();
    }
    ngOnInit() {
        this.userSubscription = this.authService.currentUser.subscribe(user => {
            this.canPerformActions = this.authService.hasRole([
                auth_service_1.UserRole.ADMIN,
                auth_service_1.UserRole.AUTHORITY,
                auth_service_1.UserRole.APPROVER,
            ]);
        });
        this.pendingApprovals$ = this.refresh$.pipe((0, operators_1.switchMap)(() => this.approvalsService.getPendingApprovals()));
        this.refreshData();
        this.wsSubscription = this.webSocketService.receiveMessages().pipe((0, operators_1.tap)(message => console.log('Received WS message:', message))).subscribe(message => {
            if (message.event === 'approval_updated' || message.event === 'new_request') {
                this.refreshData();
            }
        });
    }
    ngOnDestroy() {
        if (this.wsSubscription) {
            this.wsSubscription.unsubscribe();
        }
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }
    refreshData() {
        this.refresh$.next();
    }
    approve(request) {
        const pendingApproval = this.findPendingApproval(request);
        if (!pendingApproval) {
            alert('No pending approval found for this request.');
            return;
        }
        this.approvalsService.approve(pendingApproval.id).subscribe(() => {
            alert('Request approved successfully!');
            this.refreshData();
        });
    }
    reject(request) {
        const pendingApproval = this.findPendingApproval(request);
        if (!pendingApproval) {
            alert('No pending approval found for this request.');
            return;
        }
        const comments = prompt('Please provide a reason for rejection:');
        if (comments) {
            this.approvalsService.reject(pendingApproval.id, comments).subscribe(() => {
                alert('Request rejected successfully!');
                this.refreshData();
            });
        }
    }
    findPendingApproval(request) {
        return request.approvals.find(a => a.status === 'PENDING');
    }
};
exports.ApprovalsListComponent = ApprovalsListComponent;
exports.ApprovalsListComponent = ApprovalsListComponent = __decorate([
    (0, core_1.Component)({
        selector: 'app-approvals-list',
        standalone: true,
        imports: [common_1.CommonModule],
        templateUrl: './approvals-list.html',
        styleUrls: ['./approvals-list.scss'],
    }),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService,
        auth_service_1.AuthService,
        websocket_service_1.WebSocketService])
], ApprovalsListComponent);
//# sourceMappingURL=approvals-list.js.map