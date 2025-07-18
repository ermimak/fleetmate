import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CarRequest } from '../../requests/entities/car-request.entity';
import { Driver } from './driver.entity';

export enum CarStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum CarType {
  SEDAN = 'sedan',
  SUV = 'suv',
  VAN = 'van',
  TRUCK = 'truck',
  BUS = 'bus',
}

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plateNumber: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  color: string;

  @Column({
    type: 'enum',
    enum: CarType,
  })
  type: CarType;

  @Column()
  capacity: number;

  @Column({
    type: 'enum',
    enum: CarStatus,
    default: CarStatus.AVAILABLE,
  })
  status: CarStatus;

  @Column({ nullable: true })
  currentDriverId: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'currentDriverId' })
  currentDriver: Driver;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  lastMaintenanceDate: Date;

  @Column({ nullable: true })
  nextMaintenanceDate: Date;

  @Column({ default: 0 })
  mileage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CarRequest, request => request.assignedCar)
  requests: CarRequest[];

  get displayName(): string {
    return `${this.make} ${this.model} (${this.plateNumber})`;
  }
}
