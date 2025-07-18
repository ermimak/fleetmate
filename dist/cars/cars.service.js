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
exports.CarsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const car_entity_1 = require("./entities/car.entity");
let CarsService = class CarsService {
    constructor(carRepository) {
        this.carRepository = carRepository;
    }
    async create(createCarDto) {
        const car = this.carRepository.create(createCarDto);
        return this.carRepository.save(car);
    }
    async findAll() {
        return this.carRepository.find({
            relations: ['currentDriver'],
        });
    }
    async findAvailable(passengerCount, type) {
        const query = this.carRepository.createQueryBuilder('car')
            .leftJoinAndSelect('car.currentDriver', 'driver')
            .where('car.status = :status', { status: car_entity_1.CarStatus.AVAILABLE });
        if (passengerCount) {
            query.andWhere('car.capacity >= :capacity', { capacity: passengerCount });
        }
        if (type) {
            query.andWhere('car.type = :type', { type });
        }
        return query.getMany();
    }
    async findOne(id) {
        const car = await this.carRepository.findOne({
            where: { id },
            relations: ['currentDriver', 'requests'],
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        return car;
    }
    async findByPlateNumber(plateNumber) {
        return this.carRepository.findOne({
            where: { plateNumber },
            relations: ['currentDriver'],
        });
    }
    async update(id, updateCarDto) {
        const car = await this.findOne(id);
        await this.carRepository.update(id, updateCarDto);
        return this.findOne(id);
    }
    async updateStatus(id, status) {
        await this.carRepository.update(id, { status });
        return this.findOne(id);
    }
    async assignDriver(carId, driverId) {
        await this.carRepository.update(carId, {
            currentDriverId: driverId,
            status: car_entity_1.CarStatus.IN_USE
        });
        return this.findOne(carId);
    }
    async unassignDriver(carId) {
        await this.carRepository.update(carId, {
            currentDriverId: null,
            status: car_entity_1.CarStatus.AVAILABLE
        });
        return this.findOne(carId);
    }
    async remove(id) {
        const car = await this.findOne(id);
        await this.carRepository.remove(car);
    }
    async getCarStats() {
        const totalCars = await this.carRepository.count();
        const availableCars = await this.carRepository.count({
            where: { status: car_entity_1.CarStatus.AVAILABLE }
        });
        const inUseCars = await this.carRepository.count({
            where: { status: car_entity_1.CarStatus.IN_USE }
        });
        const maintenanceCars = await this.carRepository.count({
            where: { status: car_entity_1.CarStatus.MAINTENANCE }
        });
        const carsByType = await this.carRepository
            .createQueryBuilder('car')
            .select('car.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('car.type')
            .getRawMany();
        return {
            totalCars,
            availableCars,
            inUseCars,
            maintenanceCars,
            carsByType,
        };
    }
    async getCarsNeedingMaintenance() {
        const today = new Date();
        return this.carRepository.find({
            where: [
                { nextMaintenanceDate: null },
                { nextMaintenanceDate: today },
            ],
            relations: ['currentDriver'],
        });
    }
};
exports.CarsService = CarsService;
exports.CarsService = CarsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(car_entity_1.Car)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CarsService);
//# sourceMappingURL=cars.service.js.map