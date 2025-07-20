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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const car_request_entity_1 = require("./entities/car-request.entity");
const cars_service_1 = require("../cars/cars.service");
const drivers_service_1 = require("../cars/drivers.service");
const driver_entity_1 = require("../cars/entities/driver.entity");
const users_service_1 = require("../users/users.service");
const approvals_service_1 = require("./approvals.service");
const notifications_service_1 = require("../notifications/notifications.service");
const approval_entity_1 = require("./entities/approval.entity");
let RequestsService = class RequestsService {
    constructor(requestRepository, carsService, driversService, usersService, approvalsService, notificationsService) {
        this.requestRepository = requestRepository;
        this.carsService = carsService;
        this.driversService = driversService;
        this.usersService = usersService;
        this.approvalsService = approvalsService;
        this.notificationsService = notificationsService;
    }
    async create(userId, createRequestDto) {
        const user = await this.usersService.findOne(userId);
        const request = this.requestRepository.create({
            ...createRequestDto,
            userId,
            status: car_request_entity_1.RequestStatus.SUBMITTED,
        });
        const savedRequest = await this.requestRepository.save(request);
        if (user.managerId) {
            await this.approvalsService.createApproval({
                requestId: savedRequest.id,
                approverId: user.managerId,
                type: approval_entity_1.ApprovalType.ELIGIBILITY_CHECK,
            });
        }
        await this.notificationsService.notifyNewRequest(savedRequest);
        return savedRequest;
    }
    async findAll(filters) {
        const query = this.requestRepository.createQueryBuilder('request')
            .leftJoinAndSelect('request.user', 'user')
            .leftJoinAndSelect('request.assignedCar', 'car')
            .leftJoinAndSelect('request.assignedDriver', 'driver')
            .leftJoinAndSelect('request.approvals', 'approval')
            .leftJoinAndSelect('approval.approver', 'approver');
        if (filters) {
            if (filters.userId) {
                query.andWhere('request.userId = :userId', { userId: filters.userId });
            }
            if (filters.status) {
                query.andWhere('request.status = :status', { status: filters.status });
            }
            if (filters.priority) {
                query.andWhere('request.priority = :priority', { priority: filters.priority });
            }
            if (filters.startDate) {
                query.andWhere('request.departureDateTime >= :startDate', { startDate: filters.startDate });
            }
            if (filters.endDate) {
                query.andWhere('request.departureDateTime <= :endDate', { endDate: filters.endDate });
            }
        }
        return query.orderBy('request.createdAt', 'DESC').getMany();
    }
    async findOne(id) {
        const request = await this.requestRepository.findOne({
            where: { id },
            relations: ['user', 'assignedCar', 'assignedDriver', 'approvals', 'approvals.approver'],
        });
        if (!request) {
            throw new common_1.NotFoundException('Car request not found');
        }
        return request;
    }
    async findByUser(userId) {
        return this.requestRepository.find({
            where: { userId },
            relations: ['user', 'assignedCar', 'assignedDriver', 'approvals'],
            order: { createdAt: 'DESC' },
        });
    }
    async findPendingApprovals(approverId) {
        const query = this.requestRepository.createQueryBuilder('request')
            .innerJoin('request.approvals', 'approval', 'approval.approverId = :approverId AND approval.status = :status', { approverId, status: approval_entity_1.ApprovalStatus.PENDING })
            .leftJoinAndSelect('request.user', 'user')
            .orderBy('request.createdAt', 'DESC');
        return query.getMany();
    }
    async update(id, updateRequestDto) {
        const request = await this.findOne(id);
        if (request.status === car_request_entity_1.RequestStatus.COMPLETED || request.status === car_request_entity_1.RequestStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot update a completed or cancelled request');
        }
        await this.requestRepository.update(id, updateRequestDto);
        return this.findOne(id);
    }
    async updateStatus(id, status, reason) {
        const request = await this.findOne(id);
        if (status === car_request_entity_1.RequestStatus.REJECTED && !reason) {
            throw new common_1.BadRequestException('Rejection reason is required');
        }
        const updates = { status };
        if (status === car_request_entity_1.RequestStatus.REJECTED) {
            updates.rejectionReason = reason;
        }
        await this.requestRepository.update(id, updates);
        const updatedRequest = await this.findOne(id);
        await this.notificationsService.notifyRequestStatusChange(updatedRequest);
        return updatedRequest;
    }
    async assignCar(id, carId, driverId) {
        const request = await this.findOne(id);
        if (request.status !== car_request_entity_1.RequestStatus.APPROVED) {
            throw new common_1.BadRequestException('Can only assign car to approved requests');
        }
        const car = await this.carsService.findOne(carId);
        const driver = await this.driversService.findOne(driverId);
        await this.requestRepository.update(id, {
            assignedCarId: carId,
            assignedDriverId: driverId,
            status: car_request_entity_1.RequestStatus.CAR_ASSIGNED,
        });
        await this.carsService.assignDriver(carId, driverId);
        await this.driversService.updateStatus(driverId, driver_entity_1.DriverStatus.ASSIGNED);
        const updatedRequest = await this.findOne(id);
        await this.notificationsService.notifyCarAssigned(updatedRequest);
        return updatedRequest;
    }
    async startTrip(id) {
        const request = await this.findOne(id);
        if (request.status !== car_request_entity_1.RequestStatus.CAR_ASSIGNED) {
            throw new common_1.BadRequestException('Can only start trips for requests with assigned cars');
        }
        await this.requestRepository.update(id, {
            status: car_request_entity_1.RequestStatus.IN_PROGRESS,
            actualDepartureTime: new Date(),
        });
        return this.findOne(id);
    }
    async completeTrip(id, totalDistance, tripNotes) {
        const request = await this.findOne(id);
        if (request.status !== car_request_entity_1.RequestStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Can only complete trips that are in progress');
        }
        await this.requestRepository.update(id, {
            status: car_request_entity_1.RequestStatus.COMPLETED,
            actualReturnTime: new Date(),
            totalDistance,
            tripNotes,
        });
        if (request.assignedCarId) {
            await this.carsService.unassignDriver(request.assignedCarId);
        }
        if (request.assignedDriverId) {
            await this.driversService.updateStatus(request.assignedDriverId, driver_entity_1.DriverStatus.ASSIGNED);
        }
        return this.findOne(id);
    }
    async cancelRequest(id, reason) {
        const request = await this.findOne(id);
        if (request.status === car_request_entity_1.RequestStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed request');
        }
        await this.requestRepository.update(id, {
            status: car_request_entity_1.RequestStatus.CANCELLED,
            rejectionReason: reason,
        });
        if (request.status === car_request_entity_1.RequestStatus.CAR_ASSIGNED || request.status === car_request_entity_1.RequestStatus.IN_PROGRESS) {
            if (request.assignedCarId) {
                await this.carsService.unassignDriver(request.assignedCarId);
            }
            if (request.assignedDriverId) {
                await this.driversService.updateStatus(request.assignedDriverId, driver_entity_1.DriverStatus.AVAILABLE);
            }
        }
        return this.findOne(id);
    }
    async getRequestStats() {
        const totalRequests = await this.requestRepository.count();
        const pendingRequests = await this.requestRepository.count({
            where: [
                { status: car_request_entity_1.RequestStatus.SUBMITTED },
                { status: car_request_entity_1.RequestStatus.UNDER_REVIEW },
                { status: car_request_entity_1.RequestStatus.ELIGIBLE },
            ],
        });
        const approvedRequests = await this.requestRepository.count({
            where: [
                { status: car_request_entity_1.RequestStatus.APPROVED },
                { status: car_request_entity_1.RequestStatus.CAR_ASSIGNED },
                { status: car_request_entity_1.RequestStatus.IN_PROGRESS },
            ],
        });
        const completedRequests = await this.requestRepository.count({
            where: { status: car_request_entity_1.RequestStatus.COMPLETED },
        });
        const rejectedRequests = await this.requestRepository.count({
            where: [
                { status: car_request_entity_1.RequestStatus.REJECTED },
                { status: car_request_entity_1.RequestStatus.INELIGIBLE },
                { status: car_request_entity_1.RequestStatus.CANCELLED },
            ],
        });
        const requestsByPriority = await this.requestRepository
            .createQueryBuilder('request')
            .select('request.priority', 'priority')
            .addSelect('COUNT(*)', 'count')
            .groupBy('request.priority')
            .getRawMany();
        return {
            totalRequests,
            pendingRequests,
            approvedRequests,
            completedRequests,
            rejectedRequests,
            requestsByPriority,
        };
    }
    async getOverdueRequests() {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        return this.requestRepository.find({
            where: [
                { status: car_request_entity_1.RequestStatus.SUBMITTED, createdAt: twentyFourHoursAgo },
                { status: car_request_entity_1.RequestStatus.UNDER_REVIEW, createdAt: twentyFourHoursAgo },
            ],
            relations: ['user', 'approvals', 'approvals.approver'],
        });
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(car_request_entity_1.CarRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cars_service_1.CarsService,
        drivers_service_1.DriversService,
        users_service_1.UsersService,
        approvals_service_1.ApprovalsService,
        notifications_service_1.NotificationsService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map