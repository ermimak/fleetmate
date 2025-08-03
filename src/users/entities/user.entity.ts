import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CarRequest } from '../../requests/entities/car-request.entity';
import { Approval } from '../../requests/entities/approval.entity';

export enum UserRole {
  USER = 'user',
  AUTHORITY = 'authority',
  APPROVER = 'approver',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  department: string;

  @Column()
  position: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true, unique: true })
  telegramId: string;

  @Column({ nullable: true })
  telegramUsername: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  managerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CarRequest, request => request.user)
  requests: CarRequest[];

  @OneToMany(() => Approval, approval => approval.approver)
  approvals: Approval[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
