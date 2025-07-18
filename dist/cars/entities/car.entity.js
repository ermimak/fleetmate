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
exports.Car = exports.CarType = exports.CarStatus = void 0;
const typeorm_1 = require("typeorm");
const car_request_entity_1 = require("../../requests/entities/car-request.entity");
const driver_entity_1 = require("./driver.entity");
var CarStatus;
(function (CarStatus) {
    CarStatus["AVAILABLE"] = "available";
    CarStatus["IN_USE"] = "in_use";
    CarStatus["MAINTENANCE"] = "maintenance";
    CarStatus["OUT_OF_SERVICE"] = "out_of_service";
})(CarStatus || (exports.CarStatus = CarStatus = {}));
var CarType;
(function (CarType) {
    CarType["SEDAN"] = "sedan";
    CarType["SUV"] = "suv";
    CarType["VAN"] = "van";
    CarType["TRUCK"] = "truck";
    CarType["BUS"] = "bus";
})(CarType || (exports.CarType = CarType = {}));
let Car = class Car {
    get displayName() {
        return `${this.make} ${this.model} (${this.plateNumber})`;
    }
};
exports.Car = Car;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Car.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Car.prototype, "plateNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Car.prototype, "make", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Car.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Car.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Car.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CarType,
    }),
    __metadata("design:type", String)
], Car.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Car.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CarStatus,
        default: CarStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Car.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Car.prototype, "currentDriverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => driver_entity_1.Driver, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'currentDriverId' }),
    __metadata("design:type", driver_entity_1.Driver)
], Car.prototype, "currentDriver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Car.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Car.prototype, "lastMaintenanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Car.prototype, "nextMaintenanceDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Car.prototype, "mileage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Car.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Car.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => car_request_entity_1.CarRequest, request => request.assignedCar),
    __metadata("design:type", Array)
], Car.prototype, "requests", void 0);
exports.Car = Car = __decorate([
    (0, typeorm_1.Entity)('cars')
], Car);
//# sourceMappingURL=car.entity.js.map