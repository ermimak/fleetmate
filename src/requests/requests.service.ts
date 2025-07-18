import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CarRequest, RequestStatus, RequestPriority } from './entities/car-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CarsService } from '../cars/cars.service';
import { DriversService } from '../cars/drivers.service';
import { DriverStatus } from '../cars/entities/driver.entity';
import { UsersService } from '../users/users.service';
import { ApprovalsService } from './approvals.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApprovalType } from './entities/approval.entity';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(CarRequest)
    private requestRepository: Repository<CarRequest>,
    private carsService: CarsService,
    private driversService: DriversService,
    private usersService: UsersService,
    private approvalsService: ApprovalsService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createRequestDto: CreateRequestDto): Promise<CarRequest> {
    const user = await this.usersService.findOne(userId);
    
    const request = this.requestRepository.create({
      ...createRequestDto,
      userId,
      status: RequestStatus.SUBMITTED,
    });

    const savedRequest = await this.requestRepository.save(request);
    
    // Create an eligibility check approval task
    if (user.managerId) {
      await this.approvalsService.createApproval({
        requestId: savedRequest.id,
        approverId: user.managerId,
        type: ApprovalType.ELIGIBILITY_CHECK,
      });
    }

    // Notify managers about new request
    await this.notificationsService.notifyNewRequest(savedRequest);
    
    return savedRequest;
  }

  async findAll(filters?: any): Promise<CarRequest[]> {
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

  async findOne(id: string): Promise<CarRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['user', 'assignedCar', 'assignedDriver', 'approvals', 'approvals.approver'],
    });

    if (!request) {
      throw new NotFoundException('Car request not found');
    }

    return request;
  }

  async findByUser(userId: string): Promise<CarRequest[]> {
    return this.requestRepository.find({
      where: { userId },
      relations: ['assignedCar', 'assignedDriver', 'approvals'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingApprovals(approverId: string): Promise<CarRequest[]> {
    const query = this.requestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.approvals', 'approval')
      .leftJoinAndSelect('request.user', 'user')
      .where('approval.approverId = :approverId', { approverId })
      .andWhere('approval.status = :status', { status: 'pending' });
      
    return query.getMany();
  }

  async update(id: string, updateRequestDto: UpdateRequestDto): Promise<CarRequest> {
    const request = await this.findOne(id);
    
    // Only allow updates if the request is not completed or cancelled
    if (request.status === RequestStatus.COMPLETED || request.status === RequestStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a completed or cancelled request');
    }
    
    await this.requestRepository.update(id, updateRequestDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: RequestStatus, reason?: string): Promise<CarRequest> {
    const request = await this.findOne(id);
    
    if (status === RequestStatus.REJECTED && !reason) {
      throw new BadRequestException('Rejection reason is required');
    }
    
    const updates: any = { status };
    
    if (status === RequestStatus.REJECTED) {
      updates.rejectionReason = reason;
    }
    
    await this.requestRepository.update(id, updates);
    
    const updatedRequest = await this.findOne(id);
    
    // Notify the user about the status change
    await this.notificationsService.notifyRequestStatusChange(updatedRequest);
    
    return updatedRequest;
  }

  async assignCar(id: string, carId: string, driverId: string): Promise<CarRequest> {
    const request = await this.findOne(id);
    
    if (request.status !== RequestStatus.APPROVED) {
      throw new BadRequestException('Can only assign car to approved requests');
    }
    
    const car = await this.carsService.findOne(carId);
    const driver = await this.driversService.findOne(driverId);
    
    await this.requestRepository.update(id, {
      assignedCarId: carId,
      assignedDriverId: driverId,
      status: RequestStatus.CAR_ASSIGNED,
    });
    
    // Update car and driver status
    await this.carsService.assignDriver(carId, driverId);
    await this.driversService.updateStatus(driverId, DriverStatus.ASSIGNED);
    
    const updatedRequest = await this.findOne(id);
    
    // Notify the user about the car assignment
    await this.notificationsService.notifyCarAssigned(updatedRequest);
    
    return updatedRequest;
  }

  async startTrip(id: string): Promise<CarRequest> {
    const request = await this.findOne(id);
    
    if (request.status !== RequestStatus.CAR_ASSIGNED) {
      throw new BadRequestException('Can only start trips for requests with assigned cars');
    }
    
    await this.requestRepository.update(id, {
      status: RequestStatus.IN_PROGRESS,
      actualDepartureTime: new Date(),
    });
    
    return this.findOne(id);
  }

  async completeTrip(id: string, totalDistance: number, tripNotes?: string): Promise<CarRequest> {
    const request = await this.findOne(id);
    
    if (request.status !== RequestStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only complete trips that are in progress');
    }
    
    await this.requestRepository.update(id, {
      status: RequestStatus.COMPLETED,
      actualReturnTime: new Date(),
      totalDistance,
      tripNotes,
    });
    
    // Free up the car and driver
    if (request.assignedCarId) {
      await this.carsService.unassignDriver(request.assignedCarId);
    }
    // Update driver status to assigned
    if (request.assignedDriverId) {
      await this.driversService.updateStatus(request.assignedDriverId, DriverStatus.ASSIGNED);
    }
    
    return this.findOne(id);
  }

  async cancelRequest(id: string, reason: string): Promise<CarRequest> {
    const request = await this.findOne(id);
    
    // Cannot cancel completed requests
    if (request.status === RequestStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed request');
    }
    
    await this.requestRepository.update(id, {
      status: RequestStatus.CANCELLED,
      rejectionReason: reason,
    });
    
    // Free up the car and driver if assigned
    if (request.status === RequestStatus.CAR_ASSIGNED || request.status === RequestStatus.IN_PROGRESS) {
      if (request.assignedCarId) {
        await this.carsService.unassignDriver(request.assignedCarId);
      }
      
      if (request.assignedDriverId) {
        await this.driversService.updateStatus(request.assignedDriverId, DriverStatus.AVAILABLE);
      }
    }
    
    return this.findOne(id);
  }

  async getRequestStats() {
    const totalRequests = await this.requestRepository.count();
    const pendingRequests = await this.requestRepository.count({
      where: [
        { status: RequestStatus.SUBMITTED },
        { status: RequestStatus.UNDER_REVIEW },
        { status: RequestStatus.ELIGIBLE },
      ],
    });
    const approvedRequests = await this.requestRepository.count({
      where: [
        { status: RequestStatus.APPROVED },
        { status: RequestStatus.CAR_ASSIGNED },
        { status: RequestStatus.IN_PROGRESS },
      ],
    });
    const completedRequests = await this.requestRepository.count({
      where: { status: RequestStatus.COMPLETED },
    });
    const rejectedRequests = await this.requestRepository.count({
      where: [
        { status: RequestStatus.REJECTED },
        { status: RequestStatus.INELIGIBLE },
        { status: RequestStatus.CANCELLED },
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

  async getOverdueRequests(): Promise<CarRequest[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.requestRepository.find({
      where: [
        { status: RequestStatus.SUBMITTED, createdAt: twentyFourHoursAgo },
        { status: RequestStatus.UNDER_REVIEW, createdAt: twentyFourHoursAgo },
      ],
      relations: ['user', 'approvals', 'approvals.approver'],
    });
  }
}
