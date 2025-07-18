import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CarRequest } from './car-request.entity';

export enum ApprovalType {
  ELIGIBILITY_CHECK = 'eligibility_check',
  FINAL_APPROVAL = 'final_approval',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  requestId: string;

  @ManyToOne(() => CarRequest, request => request.approvals)
  @JoinColumn({ name: 'requestId' })
  request: CarRequest;

  @Column()
  approverId: string;

  @ManyToOne(() => User, user => user.approvals)
  @JoinColumn({ name: 'approverId' })
  approver: User;

  @Column({
    type: 'enum',
    enum: ApprovalType,
  })
  type: ApprovalType;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;
}
