"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const requests_service_1 = require("./requests.service");
const requests_controller_1 = require("./requests.controller");
const approvals_service_1 = require("./approvals.service");
const approvals_controller_1 = require("./approvals.controller");
const car_request_entity_1 = require("./entities/car-request.entity");
const approval_entity_1 = require("./entities/approval.entity");
const cars_module_1 = require("../cars/cars.module");
const users_module_1 = require("../users/users.module");
const notifications_module_1 = require("../notifications/notifications.module");
let RequestsModule = class RequestsModule {
};
exports.RequestsModule = RequestsModule;
exports.RequestsModule = RequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([car_request_entity_1.CarRequest, approval_entity_1.Approval]),
            cars_module_1.CarsModule,
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [requests_service_1.RequestsService, approvals_service_1.ApprovalsService],
        controllers: [requests_controller_1.RequestsController, approvals_controller_1.ApprovalsController],
        exports: [requests_service_1.RequestsService, approvals_service_1.ApprovalsService],
    })
], RequestsModule);
//# sourceMappingURL=requests.module.js.map