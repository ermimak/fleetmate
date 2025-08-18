import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  code: string; // Department code (e.g., 'OPS', 'HR', 'IT')

  @Column({ nullable: true })
  authorityId: string; // User ID of the department authority

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'authorityId' })
  authority: User;

  @OneToMany(() => User, user => user.department)
  users: User[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
