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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const approval_entity_1 = require("./entities/approval.entity");
const car_request_entity_1 = require("./entities/car-request.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/entities/user.entity");
let ApprovalsService = class ApprovalsService {
    constructor(approvalRepository, requestRepository, notificationsService, usersService) {
        this.approvalRepository = approvalRepository;
        this.requestRepository = requestRepository;
        this.notificationsService = notificationsService;
        this.usersService = usersService;
    }
    async createApproval(createApprovalDto) {
        const approval = this.approvalRepository.create({
            ...createApprovalDto,
            status: approval_entity_1.ApprovalStatus.PENDING,
        });
        const savedApproval = await this.approvalRepository.save(approval);
        await this.requestRepository.update(createApprovalDto.requestId, {
            status: car_request_entity_1.RequestStatus.UNDER_REVIEW,
        });
        await this.notificationsService.notifyApprovalAssigned(savedApproval);
        return savedApproval;
    }
    async findAll() {
        return this.approvalRepository.find({
            relations: ['request', 'approver'],
        });
    }
    async findByRequest(requestId) {
        return this.approvalRepository.find({
            where: { requestId },
            relations: ['approver'],
        });
    }
    async findByApprover(approverId) {
        return this.approvalRepository.find({
            where: { approverId },
            relations: ['request', 'request.user'],
        });
    }
    async findPendingByApprover(approverId) {
        return this.approvalRepository.find({
            where: {
                approverId,
                status: approval_entity_1.ApprovalStatus.PENDING,
            },
            relations: ['request', 'request.user'],
        });
    }
    async findOne(id) {
        const approval = await this.approvalRepository.findOne({
            where: { id },
            relations: ['request', 'approver'],
        });
        if (!approval) {
            throw new common_1.NotFoundException('Approval not found');
        }
        return approval;
    }
    async approve(id, comments) {
        const approval = await this.findOne(id);
        if (approval.status !== approval_entity_1.ApprovalStatus.PENDING) {
            throw new common_1.BadRequestException('Can only approve pending approvals');
        }
        await this.approvalRepository.update(id, {
            status: approval_entity_1.ApprovalStatus.APPROVED,
            comments,
            approvedAt: new Date(),
        });
        const updatedApproval = await this.findOne(id);
        if (approval.type === approval_entity_1.ApprovalType.ELIGIBILITY_CHECK) {
            await this.requestRepository.update(approval.requestId, {
                status: car_request_entity_1.RequestStatus.ELIGIBLE,
            });
            await this.createFinalApproval(approval.requestId);
        }
        else if (approval.type === approval_entity_1.ApprovalType.FINAL_APPROVAL) {
            await this.requestRepository.update(approval.requestId, {
                status: car_request_entity_1.RequestStatus.APPROVED,
            });
        }
        await this.notificationsService.notifyApprovalDecision(updatedApproval, true);
        return updatedApproval;
    }
    async reject(id, comments) {
        const approval = await this.findOne(id);
        if (approval.status !== approval_entity_1.ApprovalStatus.PENDING) {
            throw new common_1.BadRequestException('Can only reject pending approvals');
        }
        if (!comments) {
            throw new common_1.BadRequestException('Comments are required for rejection');
        }
        await this.approvalRepository.update(id, {
            status: approval_entity_1.ApprovalStatus.REJECTED,
            comments,
            approvedAt: new Date(),
        });
        const updatedApproval = await this.findOne(id);
        if (approval.type === approval_entity_1.ApprovalType.ELIGIBILITY_CHECK) {
            await this.requestRepository.update(approval.requestId, {
                status: car_request_entity_1.RequestStatus.INELIGIBLE,
                rejectionReason: comments,
            });
        }
        else if (approval.type === approval_entity_1.ApprovalType.FINAL_APPROVAL) {
            await this.requestRepository.update(approval.requestId, {
                status: car_request_entity_1.RequestStatus.REJECTED,
                rejectionReason: comments,
            });
        }
        await this.notificationsService.notifyApprovalDecision(updatedApproval, false);
        await this.notificationsService.notifyRequestRejected(updatedApproval.request, comments);
        return updatedApproval;
    }
    async createFinalApproval(requestId) {
        const admins = await this.usersService.findByRole(user_entity_1.UserRole.ADMIN);
        if (!admins.length) {
            console.error('No admin user found to assign final approval.');
            return;
        }
        const adminApproverId = admins[0].id;
        const finalApproval = await this.createApproval({
            requestId,
            approverId: adminApproverId,
            type: approval_entity_1.ApprovalType.FINAL_APPROVAL,
        });
        await this.notificationsService.notifyApprovalAssigned(finalApproval);
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(approval_entity_1.Approval)),
    __param(1, (0, typeorm_1.InjectRepository)(car_request_entity_1.CarRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService,
        users_service_1.UsersService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map