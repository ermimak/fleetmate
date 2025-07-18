import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { CarType } from '../entities/car.entity';

export class CreateCarDto {
  @IsNotEmpty()
  plateNumber: string;

  @IsNotEmpty()
  make: string;

  @IsNotEmpty()
  model: string;

  @IsNumber()
  year: number;

  @IsNotEmpty()
  color: string;

  @IsEnum(CarType)
  type: CarType;

  @IsNumber()
  capacity: number;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: Date;

  @IsOptional()
  @IsDateString()
  nextMaintenanceDate?: Date;

  @IsOptional()
  @IsNumber()
  mileage?: number;
}
