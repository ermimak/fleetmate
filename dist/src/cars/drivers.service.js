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
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("./entities/driver.entity");
let DriversService = class DriversService {
    constructor(driverRepository) {
        this.driverRepository = driverRepository;
    }
    async create(createDriverDto) {
        const driver = this.driverRepository.create(createDriverDto);
        return this.driverRepository.save(driver);
    }
    async findAll() {
        return this.driverRepository.find();
    }
    async findAvailable() {
        return this.driverRepository.find({
            where: { status: driver_entity_1.DriverStatus.AVAILABLE },
        });
    }
    async findOne(id) {
        const driver = await this.driverRepository.findOne({
            where: { id },
            relations: ['requests'],
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver not found');
        }
        return driver;
    }
    async findByLicenseNumber(licenseNumber) {
        return this.driverRepository.findOne({ where: { licenseNumber } });
    }
    async update(id, updateDriverDto) {
        const driver = await this.findOne(id);
        await this.driverRepository.update(id, updateDriverDto);
        return this.findOne(id);
    }
    async updateStatus(id, status) {
        await this.driverRepository.update(id, { status });
        return this.findOne(id);
    }
    async remove(id) {
        const driver = await this.findOne(id);
        await this.driverRepository.remove(driver);
    }
    async getDriverStats() {
        const totalDrivers = await this.driverRepository.count();
        const availableDrivers = await this.driverRepository.count({
            where: { status: driver_entity_1.DriverStatus.AVAILABLE }
        });
        const assignedDrivers = await this.driverRepository.count({
            where: { status: driver_entity_1.DriverStatus.ASSIGNED }
        });
        return {
            totalDrivers,
            availableDrivers,
            assignedDrivers,
        };
    }
    async getDriversWithExpiringLicenses(days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return this.driverRepository
            .createQueryBuilder('driver')
            .where('driver.licenseExpiryDate <= :futureDate', { futureDate })
            .getMany();
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DriversService);
//# sourceMappingURL=drivers.service.js.map