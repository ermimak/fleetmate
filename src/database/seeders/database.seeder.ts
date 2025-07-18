import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { Car, CarStatus, CarType } from '../../cars/entities/car.entity';
import { Driver, DriverStatus } from '../../cars/entities/driver.entity';
import { CarRequest, RequestStatus } from '../../requests/entities/car-request.entity';
import { Approval, ApprovalStatus, ApprovalType } from '../../requests/entities/approval.entity';

@Injectable()
export class DatabaseSeeder {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(CarRequest)
    private requestRepository: Repository<CarRequest>,
    @InjectRepository(Approval)
    private approvalRepository: Repository<Approval>,
  ) {}

  async seed() {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await this.clearDatabase();

    // Seed users
    const users = await this.seedUsers();
    console.log(`✅ Created ${users.length} users`);

    // Seed drivers
    const drivers = await this.seedDrivers();
    console.log(`✅ Created ${drivers.length} drivers`);

    // Seed cars
    const cars = await this.seedCars(drivers);
    console.log(`✅ Created ${cars.length} cars`);

    // Seed requests
    const requests = await this.seedRequests(users);
    console.log(`✅ Created ${requests.length} requests`);

    // Seed approvals
    const approvals = await this.seedApprovals(requests, users);
    console.log(`✅ Created ${approvals.length} approvals`);

    console.log('🎉 Database seeding completed!');
  }

  private async clearDatabase() {
    console.log('🧹 Clearing existing data...');
    // Delete in order to respect foreign key constraints
    await this.approvalRepository.createQueryBuilder().delete().execute();
    await this.requestRepository.createQueryBuilder().delete().execute();
    await this.carRepository.createQueryBuilder().delete().execute();
    await this.driverRepository.createQueryBuilder().delete().execute();
    await this.userRepository.createQueryBuilder().delete().execute();
  }

  private async seedUsers(): Promise<User[]> {
    const users = [
      // Admin
      {
        email: 'admin@fleetmate.com',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        department: 'IT',
        position: 'System Administrator',
        phoneNumber: '+1234567890',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        managerId: null,
      },
      // Authority
      {
        email: 'authority@fleetmate.com',
        password: await bcrypt.hash('authority123', 10),
        firstName: 'John',
        lastName: 'Authority',
        department: 'Operations',
        position: 'Operations Manager',
        phoneNumber: '+1234567891',
        role: UserRole.AUTHORITY,
        status: UserStatus.ACTIVE,
        managerId: null,
      },
      // Approver
      {
        email: 'approver@fleetmate.com',
        password: await bcrypt.hash('approver123', 10),
        firstName: 'Jane',
        lastName: 'Approver',
        department: 'Management',
        position: 'Fleet Manager',
        phoneNumber: '+1234567892',
        role: UserRole.APPROVER,
        status: UserStatus.ACTIVE,
        managerId: null,
      },
      // Regular Users
      {
        email: 'user1@fleetmate.com',
        password: await bcrypt.hash('user123', 10),
        firstName: 'Alice',
        lastName: 'Johnson',
        department: 'Sales',
        position: 'Sales Representative',
        phoneNumber: '+1234567893',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
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
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
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
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        managerId: null,
      },
    ];

    const savedUsers = [];
    for (const userData of users) {
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      savedUsers.push(savedUser);
    }

    // Set manager relationships
    const admin = savedUsers[0];
    const authority = savedUsers[1];
    const approver = savedUsers[2];
    
    // Set authority and approver to report to admin
    authority.managerId = admin.id;
    approver.managerId = admin.id;
    await this.userRepository.save([authority, approver]);

    // Set regular users to report to authority
    for (let i = 3; i < savedUsers.length; i++) {
      savedUsers[i].managerId = authority.id;
      await this.userRepository.save(savedUsers[i]);
    }

    return savedUsers;
  }

  private async seedDrivers(): Promise<Driver[]> {
    const drivers = [
      {
        firstName: 'Michael',
        lastName: 'Driver',
        licenseNumber: 'DL123456789',
        phoneNumber: '+1234567896',
        email: 'michael.driver@fleetmate.com',
        licenseExpiryDate: new Date('2025-12-31'),
        status: DriverStatus.AVAILABLE,
      },
      {
        firstName: 'Sarah',
        lastName: 'Wheeler',
        licenseNumber: 'DL987654321',
        phoneNumber: '+1234567897',
        email: 'sarah.wheeler@fleetmate.com',
        licenseExpiryDate: new Date('2025-11-30'),
        status: DriverStatus.AVAILABLE,
      },
      {
        firstName: 'David',
        lastName: 'Roads',
        licenseNumber: 'DL456789123',
        phoneNumber: '+1234567898',
        email: 'david.roads@fleetmate.com',
        licenseExpiryDate: new Date('2025-10-15'),
        status: DriverStatus.AVAILABLE,
      },
      {
        firstName: 'Emma',
        lastName: 'Transit',
        licenseNumber: 'DL789123456',
        phoneNumber: '+1234567899',
        email: 'emma.transit@fleetmate.com',
        licenseExpiryDate: new Date('2025-09-30'),
        status: DriverStatus.ASSIGNED,
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

  private async seedCars(drivers: Driver[]): Promise<Car[]> {
    const cars = [
      {
        plateNumber: 'ABC-123',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'Silver',
        type: CarType.SEDAN,
        capacity: 5,
        status: CarStatus.AVAILABLE,
        currentDriverId: null,
        mileage: 15000,
      },
      {
        plateNumber: 'XYZ-789',
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        color: 'Blue',
        type: CarType.SEDAN,
        capacity: 5,
        status: CarStatus.AVAILABLE,
        currentDriverId: null,
        mileage: 22000,
      },
      {
        plateNumber: 'DEF-456',
        make: 'Ford',
        model: 'Explorer',
        year: 2023,
        color: 'Black',
        type: CarType.SUV,
        capacity: 7,
        status: CarStatus.IN_USE,
        currentDriverId: drivers[3].id, // Assigned to Emma Transit
        mileage: 8000,
      },
      {
        plateNumber: 'GHI-789',
        make: 'Chevrolet',
        model: 'Malibu',
        year: 2022,
        color: 'White',
        type: CarType.SEDAN,
        capacity: 5,
        status: CarStatus.MAINTENANCE,
        currentDriverId: null,
        mileage: 18000,
      },
      {
        plateNumber: 'JKL-012',
        make: 'Nissan',
        model: 'Altima',
        year: 2021,
        color: 'Red',
        type: CarType.SEDAN,
        capacity: 5,
        status: CarStatus.AVAILABLE,
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

  private async seedRequests(users: User[]): Promise<CarRequest[]> {
    const regularUsers = users.filter(u => u.role === UserRole.USER);
    
    const requests = [
      {
        userId: regularUsers[0].id, // Alice Johnson
        destination: 'Downtown Office',
        purpose: 'Client Meeting',
        departureDateTime: new Date('2025-01-20T09:00:00'),
        returnDateTime: new Date('2025-01-20T17:00:00'),
        passengerCount: 2,
        additionalNotes: 'Important client presentation',
        status: RequestStatus.SUBMITTED,
      },
      {
        userId: regularUsers[1].id, // Bob Smith
        destination: 'Airport',
        purpose: 'Business Trip',
        departureDateTime: new Date('2025-01-22T06:00:00'),
        returnDateTime: new Date('2025-01-25T20:00:00'),
        passengerCount: 1,
        additionalNotes: 'Flight at 8 AM',
        status: RequestStatus.UNDER_REVIEW,
      },
      {
        userId: regularUsers[2].id, // Charlie Brown
        destination: 'Training Center',
        purpose: 'Training Session',
        departureDateTime: new Date('2025-01-21T08:30:00'),
        returnDateTime: new Date('2025-01-21T16:30:00'),
        passengerCount: 3,
        additionalNotes: 'Team training event',
        status: RequestStatus.ELIGIBLE,
      },
      {
        userId: regularUsers[0].id, // Alice Johnson
        destination: 'Conference Center',
        purpose: 'Industry Conference',
        departureDateTime: new Date('2025-01-25T07:00:00'),
        returnDateTime: new Date('2025-01-25T19:00:00'),
        passengerCount: 1,
        additionalNotes: 'Annual industry conference',
        status: RequestStatus.APPROVED,
      },
      {
        userId: regularUsers[1].id, // Bob Smith
        destination: 'Supplier Office',
        purpose: 'Vendor Meeting',
        departureDateTime: new Date('2025-01-19T10:00:00'),
        returnDateTime: new Date('2025-01-19T15:00:00'),
        passengerCount: 2,
        additionalNotes: 'Quarterly vendor review',
        status: RequestStatus.REJECTED,
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

  private async seedApprovals(requests: CarRequest[], users: User[]): Promise<Approval[]> {
    const authority = users.find(u => u.role === UserRole.AUTHORITY);
    const approver = users.find(u => u.role === UserRole.APPROVER);

    const approvals = [
      // Eligibility check approvals
      {
        requestId: requests[1].id, // Bob's airport trip
        approverId: authority.id,
        type: ApprovalType.ELIGIBILITY_CHECK,
        status: ApprovalStatus.APPROVED,
        comments: 'Business trip approved for eligibility',
        approvedAt: new Date('2025-01-18T10:00:00'),
      },
      {
        requestId: requests[2].id, // Charlie's training
        approverId: authority.id,
        type: ApprovalType.ELIGIBILITY_CHECK,
        status: ApprovalStatus.APPROVED,
        comments: 'Training session approved',
        approvedAt: new Date('2025-01-18T11:00:00'),
      },
      {
        requestId: requests[4].id, // Bob's vendor meeting
        approverId: authority.id,
        type: ApprovalType.ELIGIBILITY_CHECK,
        status: ApprovalStatus.REJECTED,
        comments: 'Public transport recommended',
        approvedAt: new Date('2025-01-18T12:00:00'),
      },
      // Final approvals
      {
        requestId: requests[3].id, // Alice's conference
        approverId: approver.id,
        type: ApprovalType.FINAL_APPROVAL,
        status: ApprovalStatus.APPROVED,
        comments: 'Conference attendance approved',
        approvedAt: new Date('2025-01-18T14:00:00'),
      },
      // Pending approvals
      {
        requestId: requests[0].id, // Alice's client meeting
        approverId: authority.id,
        type: ApprovalType.ELIGIBILITY_CHECK,
        status: ApprovalStatus.PENDING,
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
}
