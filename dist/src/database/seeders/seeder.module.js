"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_seeder_1 = require("./database.seeder");
const user_entity_1 = require("../../users/entities/user.entity");
const car_entity_1 = require("../../cars/entities/car.entity");
const driver_entity_1 = require("../../cars/entities/driver.entity");
const car_request_entity_1 = require("../../requests/entities/car-request.entity");
const approval_entity_1 = require("../../requests/entities/approval.entity");
const database_config_1 = require("../../config/database.config");
let SeederModule = class SeederModule {
};
exports.SeederModule = SeederModule;
exports.SeederModule = SeederModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useClass: database_config_1.DatabaseConfig,
            }),
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                car_entity_1.Car,
                driver_entity_1.Driver,
                car_request_entity_1.CarRequest,
                approval_entity_1.Approval,
            ]),
        ],
        providers: [database_seeder_1.DatabaseSeeder],
        exports: [database_seeder_1.DatabaseSeeder],
    })
], SeederModule);
//# sourceMappingURL=seeder.module.js.map