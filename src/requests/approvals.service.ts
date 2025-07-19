import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Approval, ApprovalStatus, ApprovalType } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { UpdateApprovalDto } from './dto/update-approval.dto';
import { CarRequest, RequestStatus } from './entities/car-request.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private approvalRepository: Repository<Approval>,
    @InjectRepository(CarRequest)
    private requestRepository: Repository<CarRequest>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async createApproval(createApprovalDto: CreateApprovalDto): Promise<Approval> {
    const approval = this.approvalRepository.create({
      ...createApprovalDto,
      status: ApprovalStatus.PENDING,
    });

    const savedApproval = await this.approvalRepository.save(approval);
    
    // Update request status
    await this.requestRepository.update(createApprovalDto.requestId, {
      status: RequestStatus.UNDER_REVIEW,
    });
    
    // Notify the approver
    await this.notificationsService.notifyApprovalAssigned(savedApproval);
    
    return savedApproval;
  }

  async findAll(): Promise<Approval[]> {
    return this.approvalRepository.find({
      relations: ['request', 'approver'],
    });
  }

  async findByRequest(requestId: string): Promise<Approval[]> {
    return this.approvalRepository.find({
      where: { requestId },
      relations: ['approver'],
    });
  }

  async findByApprover(approverId: string): Promise<Approval[]> {
    return this.approvalRepository.find({
      where: { approverId },
      relations: ['request', 'request.user'],
    });
  }

  async findPendingByApprover(approverId: string): Promise<Approval[]> {
    return this.approvalRepository.find({
      where: { 
        approverId,
        status: ApprovalStatus.PENDING,
      },
      relations: ['request', 'request.user'],
    });
  }

  async findOne(id: string): Promise<Approval> {
    const approval = await this.approvalRepository.findOne({
      where: { id },
      relations: ['request', 'approver'],
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    return approval;
  }

  async approve(id: string, comments?: string): Promise<Approval> {
    const approval = await this.findOne(id);
    
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Can only approve pending approvals');
    }
    
    await this.approvalRepository.update(id, {
      status: ApprovalStatus.APPROVED,
      comments,
      approvedAt: new Date(),
    });
    
    const updatedApproval = await this.findOne(id);
    
    // Update request status based on approval type
    if (approval.type === ApprovalType.ELIGIBILITY_CHECK) {
      await this.requestRepository.update(approval.requestId, {
        status: RequestStatus.ELIGIBLE,
      });
      
      // Create final approval task for admin/fleet manager
      await this.createFinalApproval(approval.requestId);
    } else if (approval.type === ApprovalType.FINAL_APPROVAL) {
      await this.requestRepository.update(approval.requestId, {
        status: RequestStatus.APPROVED,
      });
    }
    
    // Notify about the approval
    await this.notificationsService.notifyApprovalDecision(updatedApproval, true);
    
    return updatedApproval;
  }

  async reject(id: string, comments: string): Promise<Approval> {
    const approval = await this.findOne(id);
    
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Can only reject pending approvals');
    }
    
    if (!comments) {
      throw new BadRequestException('Comments are required for rejection');
    }
    
    await this.approvalRepository.update(id, {
      status: ApprovalStatus.REJECTED,
      comments,
      approvedAt: new Date(),
    });
    
    const updatedApproval = await this.findOne(id);
    
    // Update request status based on approval type
    if (approval.type === ApprovalType.ELIGIBILITY_CHECK) {
      await this.requestRepository.update(approval.requestId, {
        status: RequestStatus.INELIGIBLE,
        rejectionReason: comments,
      });
    } else if (approval.type === ApprovalType.FINAL_APPROVAL) {
      await this.requestRepository.update(approval.requestId, {
        status: RequestStatus.REJECTED,
        rejectionReason: comments,
      });
    }
    
    // Notify about the rejection
    await this.notificationsService.notifyApprovalDecision(updatedApproval, false);
    await this.notificationsService.notifyRequestRejected(updatedApproval.request, comments);
    
    return updatedApproval;
  }

  private async createFinalApproval(requestId: string): Promise<void> {
    const admins = await this.usersService.findByRole(UserRole.ADMIN);
    if (!admins.length) {
      // Fallback or error handling if no admin is found
      console.error('No admin user found to assign final approval.');
      // Optionally, assign to a default user or handle as an error
      return;
    }
    // Assign to the first available admin
    const adminApproverId = admins[0].id;

    await this.createApproval({
      requestId,
      approverId: adminApproverId,
      type: ApprovalType.FINAL_APPROVAL,
    });
  }
}
