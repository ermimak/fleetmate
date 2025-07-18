import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CarRequest } from '../../requests/entities/car-request.entity';

export enum DriverStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  OFF_DUTY = 'off_duty',
  ON_LEAVE = 'on_leave',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  licenseNumber: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  licenseExpiryDate: Date;

  @Column({
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.AVAILABLE,
  })
  status: DriverStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  experienceYears: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CarRequest, request => request.assignedDriver)
  requests: CarRequest[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLicenseValid(): boolean {
    return new Date() < this.licenseExpiryDate;
  }
}
