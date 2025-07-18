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
exports.CarRequest = exports.RequestPriority = exports.RequestStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const car_entity_1 = require("../../cars/entities/car.entity");
const driver_entity_1 = require("../../cars/entities/driver.entity");
const approval_entity_1 = require("./approval.entity");
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["SUBMITTED"] = "submitted";
    RequestStatus["UNDER_REVIEW"] = "under_review";
    RequestStatus["ELIGIBLE"] = "eligible";
    RequestStatus["INELIGIBLE"] = "ineligible";
    RequestStatus["APPROVED"] = "approved";
    RequestStatus["REJECTED"] = "rejected";
    RequestStatus["CAR_ASSIGNED"] = "car_assigned";
    RequestStatus["IN_PROGRESS"] = "in_progress";
    RequestStatus["COMPLETED"] = "completed";
    RequestStatus["CANCELLED"] = "cancelled";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "low";
    RequestPriority["MEDIUM"] = "medium";
    RequestPriority["HIGH"] = "high";
    RequestPriority["URGENT"] = "urgent";
})(RequestPriority || (exports.RequestPriority = RequestPriority = {}));
let CarRequest = class CarRequest {
    get isOverdue() {
        return this.status === RequestStatus.SUBMITTED &&
            new Date() > new Date(this.createdAt.getTime() + 24 * 60 * 60 * 1000);
    }
    get duration() {
        if (this.returnDateTime) {
            return Math.ceil((this.returnDateTime.getTime() - this.departureDateTime.getTime()) / (1000 * 60 * 60));
        }
        return 0;
    }
};
exports.CarRequest = CarRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CarRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CarRequest.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.requests),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], CarRequest.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CarRequest.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CarRequest.prototype, "destination", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], CarRequest.prototype, "departureDateTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], CarRequest.prototype, "returnDateTime", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CarRequest.prototype, "passengerCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RequestPriority,
        default: RequestPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], CarRequest.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.SUBMITTED,
    }),
    __metadata("design:type", String)
], CarRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CarRequest.prototype, "additionalNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CarRequest.prototype, "assignedCarId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => car_entity_1.Car, car => car.requests, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assignedCarId' }),
    __metadata("design:type", car_entity_1.Car)
], CarRequest.prototype, "assignedCar", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CarRequest.prototype, "assignedDriverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => driver_entity_1.Driver, driver => driver.requests, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assignedDriverId' }),
    __metadata("design:type", driver_entity_1.Driver)
], CarRequest.prototype, "assignedDriver", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CarRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], CarRequest.prototype, "actualDepartureTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], CarRequest.prototype, "actualReturnTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], CarRequest.prototype, "totalDistance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CarRequest.prototype, "tripNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CarRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CarRequest.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => approval_entity_1.Approval, approval => approval.request),
    __metadata("design:type", Array)
], CarRequest.prototype, "approvals", void 0);
exports.CarRequest = CarRequest = __decorate([
    (0, typeorm_1.Entity)('car_requests')
], CarRequest);
//# sourceMappingURL=car-request.entity.js.map