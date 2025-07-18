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
exports.DatabaseSeeder = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../../users/entities/user.entity");
const car_entity_1 = require("../../cars/entities/car.entity");
const driver_entity_1 = require("../../cars/entities/driver.entity");
const car_request_entity_1 = require("../../requests/entities/car-request.entity");
const approval_entity_1 = require("../../requests/entities/approval.entity");
let DatabaseSeeder = class DatabaseSeeder {
    constructor(userRepository, carRepository, driverRepository, requestRepository, approvalRepository) {
        this.userRepository = userRepository;
        this.carRepository = carRepository;
        this.driverRepository = driverRepository;
        this.requestRepository = requestRepository;
        this.approvalRepository = approvalRepository;
    }
    async seed() {
        console.log('🌱 Starting database seeding...');
        await this.clearDatabase();
        const users = await this.seedUsers();
        console.log(`✅ Created ${users.length} users`);
        const drivers = await this.seedDrivers();
        console.log(`✅ Created ${drivers.length} drivers`);
        const cars = await this.seedCars(drivers);
        console.log(`✅ Created ${cars.length} cars`);
        const requests = await this.seedRequests(users);
        console.log(`✅ Created ${requests.length} requests`);
        const approvals = await this.seedApprovals(requests, users);
        console.log(`✅ Created ${approvals.length} approvals`);
        console.log('🎉 Database seeding completed!');
    }
    async clearDatabase() {
        console.log('🧹 Clearing existing data...');
        await this.approvalRepository.createQueryBuilder().delete().execute();
        await this.requestRepository.createQueryBuilder().delete().execute();
        await this.carRepository.createQueryBuilder().delete().execute();
        await this.driverRepository.createQueryBuilder().delete().execute();
        await this.userRepository.createQueryBuilder().delete().execute();
    }
    async seedUsers() {
        const users = [
            {
                email: 'admin@fleetmate.com',
                password: await bcrypt.hash('admin123', 10),
                firstName: 'Admin',
                lastName: 'User',
                department: 'IT',
                position: 'System Administrator',
                phoneNumber: '+1234567890',
                role: user_entity_1.UserRole.ADMIN,
                status: user_entity_1.UserStatus.ACTIVE,
                managerId: null,
            },
            {
                email: 'authority@fleetmate.com',
                password: await bcrypt.hash('authority123', 10),
                firstName: 'John',
                lastName: 'Authority',
                department: 'Operations',
                position: 'Operations Manager',
                phoneNumber: '+1234567891',
                role: user_entity_1.UserRole.AUTHORITY,
                status: user_entity_1.UserStatus.ACTIVE,
                managerId: null,
            },
            {
                email: 'approver@fleetmate.com',
                password: await bcrypt.hash('approver123', 10),
                firstName: 'Jane',
                lastName: 'Approver',
                department: 'Management',
                position: 'Fleet Manager',
                phoneNumber: '+1234567892',
                role: user_entity_1.UserRole.APPROVER,
                status: user_entity_1.UserStatus.ACTIVE,
                managerId: null,
            },
            {
                email: 'user1@fleetmate.com',
                password: await bcrypt.hash('user123', 10),
                firstName: 'Alice',
                lastName: 'Johnson',
                department: 'Sales',
                position: 'Sales Representative',
                phoneNumber: '+1234567893',
                role: user_entity_1.UserRole.USER,
                status: user_entity_1.UserStatus.ACTIVE,
                managerId: null,
            },
            {
                email: 'user2@fleetmate.com',
                password: await bcrypt.hash('user123', 10),
                firstName: 'Bob',
                lastName: 'Smith',
                department: 'Marketing',
                position: 'Marketing Specialist',
                phoneNumber: '+1234567894',
                role: user_entity_1.UserRole.USER,
                status: user_entity_1.UserStatus.ACTIVE,
                managerId: null,
            },
            {
                email: 'user3@fleetmate.com',
                password: await bcrypt.hash('user123', 10),
                firstName: 'Charlie',
                lastName: 'Brown',
                department: 'HR',
                position: 'HR Coordinator',
                phoneNumber: '+1234567895',
                role: user_entity_1.UserRole.USER,
                status: user_entity_1.UserStatus.ACTIVE,
                managerId: null,
            },
        ];
        const savedUsers = [];
        for (const userData of users) {
            const user = this.userRepository.create(userData);
            const savedUser = await this.userRepository.save(user);
            savedUsers.push(savedUser);
        }
        const admin = savedUsers[0];
        const authority = savedUsers[1];
        const approver = savedUsers[2];
        authority.managerId = admin.id;
        approver.managerId = admin.id;
        await this.userRepository.save([authority, approver]);
        for (let i = 3; i < savedUsers.length; i++) {
            savedUsers[i].managerId = authority.id;
            await this.userRepository.save(savedUsers[i]);
        }
        return savedUsers;
    }
    async seedDrivers() {
        const drivers = [
            {
                firstName: 'Michael',
                lastName: 'Driver',
                licenseNumber: 'DL123456789',
                phoneNumber: '+1234567896',
                email: 'michael.driver@fleetmate.com',
                licenseExpiryDate: new Date('2025-12-31'),
                status: driver_entity_1.DriverStatus.AVAILABLE,
            },
            {
                firstName: 'Sarah',
                lastName: 'Wheeler',
                licenseNumber: 'DL987654321',
                phoneNumber: '+1234567897',
                email: 'sarah.wheeler@fleetmate.com',
                licenseExpiryDate: new Date('2025-11-30'),
                status: driver_entity_1.DriverStatus.AVAILABLE,
            },
            {
                firstName: 'David',
                lastName: 'Roads',
                licenseNumber: 'DL456789123',
                phoneNumber: '+1234567898',
                email: 'david.roads@fleetmate.com',
                licenseExpiryDate: new Date('2025-10-15'),
                status: driver_entity_1.DriverStatus.AVAILABLE,
            },
            {
                firstName: 'Emma',
                lastName: 'Transit',
                licenseNumber: 'DL789123456',
                phoneNumber: '+1234567899',
                email: 'emma.transit@fleetmate.com',
                licenseExpiryDate: new Date('2025-09-30'),
                status: driver_entity_1.DriverStatus.ASSIGNED,
            },
        ];
        const savedDrivers = [];
        for (const driverData of drivers) {
            const driver = this.driverRepository.create(driverData);
            const savedDriver = await this.driverRepository.save(driver);
            savedDrivers.push(savedDriver);
        }
        return savedDrivers;
    }
    async seedCars(drivers) {
        const cars = [
            {
                plateNumber: 'ABC-123',
                make: 'Toyota',
                model: 'Camry',
                year: 2022,
                color: 'Silver',
                type: car_entity_1.CarType.SEDAN,
                capacity: 5,
                status: car_entity_1.CarStatus.AVAILABLE,
                currentDriverId: null,
                mileage: 15000,
            },
            {
                plateNumber: 'XYZ-789',
                make: 'Honda',
                model: 'Accord',
                year: 2021,
                color: 'Blue',
                type: car_entity_1.CarType.SEDAN,
                capacity: 5,
                status: car_entity_1.CarStatus.AVAILABLE,
                currentDriverId: null,
                mileage: 22000,
            },
            {
                plateNumber: 'DEF-456',
                make: 'Ford',
                model: 'Explorer',
                year: 2023,
                color: 'Black',
                type: car_entity_1.CarType.SUV,
                capacity: 7,
                status: car_entity_1.CarStatus.IN_USE,
                currentDriverId: drivers[3].id,
                mileage: 8000,
            },
            {
                plateNumber: 'GHI-789',
                make: 'Chevrolet',
                model: 'Malibu',
                year: 2022,
                color: 'White',
                type: car_entity_1.CarType.SEDAN,
                capacity: 5,
                status: car_entity_1.CarStatus.MAINTENANCE,
                currentDriverId: null,
                mileage: 18000,
            },
            {
                plateNumber: 'JKL-012',
                make: 'Nissan',
                model: 'Altima',
                year: 2021,
                color: 'Red',
                type: car_entity_1.CarType.SEDAN,
                capacity: 5,
                status: car_entity_1.CarStatus.AVAILABLE,
                currentDriverId: null,
                mileage: 25000,
            },
        ];
        const savedCars = [];
        for (const carData of cars) {
            const car = this.carRepository.create(carData);
            const savedCar = await this.carRepository.save(car);
            savedCars.push(savedCar);
        }
        return savedCars;
    }
    async seedRequests(users) {
        const regularUsers = users.filter(u => u.role === user_entity_1.UserRole.USER);
        const requests = [
            {
                userId: regularUsers[0].id,
                destination: 'Downtown Office',
                purpose: 'Client Meeting',
                departureDateTime: new Date('2025-01-20T09:00:00'),
                returnDateTime: new Date('2025-01-20T17:00:00'),
                passengerCount: 2,
                additionalNotes: 'Important client presentation',
                status: car_request_entity_1.RequestStatus.SUBMITTED,
            },
            {
                userId: regularUsers[1].id,
                destination: 'Airport',
                purpose: 'Business Trip',
                departureDateTime: new Date('2025-01-22T06:00:00'),
                returnDateTime: new Date('2025-01-25T20:00:00'),
                passengerCount: 1,
                additionalNotes: 'Flight at 8 AM',
                status: car_request_entity_1.RequestStatus.UNDER_REVIEW,
            },
            {
                userId: regularUsers[2].id,
                destination: 'Training Center',
                purpose: 'Training Session',
                departureDateTime: new Date('2025-01-21T08:30:00'),
                returnDateTime: new Date('2025-01-21T16:30:00'),
                passengerCount: 3,
                additionalNotes: 'Team training event',
                status: car_request_entity_1.RequestStatus.ELIGIBLE,
            },
            {
                userId: regularUsers[0].id,
                destination: 'Conference Center',
                purpose: 'Industry Conference',
                departureDateTime: new Date('2025-01-25T07:00:00'),
                returnDateTime: new Date('2025-01-25T19:00:00'),
                passengerCount: 1,
                additionalNotes: 'Annual industry conference',
                status: car_request_entity_1.RequestStatus.APPROVED,
            },
            {
                userId: regularUsers[1].id,
                destination: 'Supplier Office',
                purpose: 'Vendor Meeting',
                departureDateTime: new Date('2025-01-19T10:00:00'),
                returnDateTime: new Date('2025-01-19T15:00:00'),
                passengerCount: 2,
                additionalNotes: 'Quarterly vendor review',
                status: car_request_entity_1.RequestStatus.REJECTED,
                rejectionReason: 'Alternative transport available',
            },
        ];
        const savedRequests = [];
        for (const requestData of requests) {
            const request = this.requestRepository.create(requestData);
            const savedRequest = await this.requestRepository.save(request);
            savedRequests.push(savedRequest);
        }
        return savedRequests;
    }
    async seedApprovals(requests, users) {
        const authority = users.find(u => u.role === user_entity_1.UserRole.AUTHORITY);
        const approver = users.find(u => u.role === user_entity_1.UserRole.APPROVER);
        const approvals = [
            {
                requestId: requests[1].id,
                approverId: authority.id,
                type: approval_entity_1.ApprovalType.ELIGIBILITY_CHECK,
                status: approval_entity_1.ApprovalStatus.APPROVED,
                comments: 'Business trip approved for eligibility',
                approvedAt: new Date('2025-01-18T10:00:00'),
            },
            {
                requestId: requests[2].id,
                approverId: authority.id,
                type: approval_entity_1.ApprovalType.ELIGIBILITY_CHECK,
                status: approval_entity_1.ApprovalStatus.APPROVED,
                comments: 'Training session approved',
                approvedAt: new Date('2025-01-18T11:00:00'),
            },
            {
                requestId: requests[4].id,
                approverId: authority.id,
                type: approval_entity_1.ApprovalType.ELIGIBILITY_CHECK,
                status: approval_entity_1.ApprovalStatus.REJECTED,
                comments: 'Public transport recommended',
                approvedAt: new Date('2025-01-18T12:00:00'),
            },
            {
                requestId: requests[3].id,
                approverId: approver.id,
                type: approval_entity_1.ApprovalType.FINAL_APPROVAL,
                status: approval_entity_1.ApprovalStatus.APPROVED,
                comments: 'Conference attendance approved',
                approvedAt: new Date('2025-01-18T14:00:00'),
            },
            {
                requestId: requests[0].id,
                approverId: authority.id,
                type: approval_entity_1.ApprovalType.ELIGIBILITY_CHECK,
                status: approval_entity_1.ApprovalStatus.PENDING,
                comments: null,
                approvedAt: null,
            },
        ];
        const savedApprovals = [];
        for (const approvalData of approvals) {
            const approval = this.approvalRepository.create(approvalData);
            const savedApproval = await this.approvalRepository.save(approval);
            savedApprovals.push(savedApproval);
        }
        return savedApprovals;
    }
};
exports.DatabaseSeeder = DatabaseSeeder;
exports.DatabaseSeeder = DatabaseSeeder = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(car_entity_1.Car)),
    __param(2, (0, typeorm_1.InjectRepository)(driver_entity_1.Driver)),
    __param(3, (0, typeorm_1.InjectRepository)(car_request_entity_1.CarRequest)),
    __param(4, (0, typeorm_1.InjectRepository)(approval_entity_1.Approval)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DatabaseSeeder);
//# sourceMappingURL=database.seeder.js.map