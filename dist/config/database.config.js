"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = exports.DatabaseConfig = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const car_request_entity_1 = require("../requests/entities/car-request.entity");
const car_entity_1 = require("../cars/entities/car.entity");
const driver_entity_1 = require("../cars/entities/driver.entity");
const approval_entity_1 = require("../requests/entities/approval.entity");
let DatabaseConfig = class DatabaseConfig {
    createTypeOrmOptions() {
        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || 'fleetmate_user',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'fleetmate_db',
            entities: [user_entity_1.User, car_request_entity_1.CarRequest, car_entity_1.Car, driver_entity_1.Driver, approval_entity_1.Approval],
            synchronize: process.env.NODE_ENV === 'development',
            logging: process.env.NODE_ENV === 'development',
            migrations: ['dist/migrations/*.js'],
            migrationsTableName: 'migrations',
        };
    }
};
exports.DatabaseConfig = DatabaseConfig;
exports.DatabaseConfig = DatabaseConfig = __decorate([
    (0, common_1.Injectable)()
], DatabaseConfig);
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'fleetmate_user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'fleetmate_db',
    entities: [user_entity_1.User, car_request_entity_1.CarRequest, car_entity_1.Car, driver_entity_1.Driver, approval_entity_1.Approval],
    migrations: ['src/migrations/*.ts'],
    migrationsTableName: 'migrations',
});
//# sourceMappingURL=database.config.js.map