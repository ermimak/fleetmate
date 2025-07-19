import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Car } from '../../cars/entities/car.entity';
import { Driver } from '../../cars/entities/driver.entity';
import { Approval } from './approval.entity';

export enum RequestStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ELIGIBLE = 'eligible',
  INELIGIBLE = 'ineligible',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CAR_ASSIGNED = 'car_assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PENDING_ELIGIBILITY = "PENDING_ELIGIBILITY",
  PENDING_APPROVAL = "PENDING_APPROVAL",
}

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('car_requests')
export class CarRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.requests)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  purpose: string;

  @Column()
  destination: string;

  @Column()
  departureDateTime: Date;

  @Column({ nullable: true })
  returnDateTime: Date;

  @Column()
  passengerCount: number;

  @Column({
    type: 'enum',
    enum: RequestPriority,
    default: RequestPriority.MEDIUM,
  })
  priority: RequestPriority;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.SUBMITTED,
  })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  additionalNotes: string;

  @Column({ nullable: true })
  assignedCarId: string;

  @ManyToOne(() => Car, car => car.requests, { nullable: true })
  @JoinColumn({ name: 'assignedCarId' })
  assignedCar: Car;

  @Column({ nullable: true })
  assignedDriverId: string;

  @ManyToOne(() => Driver, driver => driver.requests, { nullable: true })
  @JoinColumn({ name: 'assignedDriverId' })
  assignedDriver: Driver;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  actualDepartureTime: Date;

  @Column({ nullable: true })
  actualReturnTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalDistance: number;

  @Column({ type: 'text', nullable: true })
  tripNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Approval, approval => approval.request)
  approvals: Approval[];

  get isOverdue(): boolean {
    return this.status === RequestStatus.SUBMITTED && 
           new Date() > new Date(this.createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  }

  get duration(): number {
    if (this.returnDateTime) {
      return Math.ceil((this.returnDateTime.getTime() - this.departureDateTime.getTime()) / (1000 * 60 * 60)); // hours
    }
    return 0;
  }
}
