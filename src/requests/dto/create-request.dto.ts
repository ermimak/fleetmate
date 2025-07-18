import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { RequestPriority } from '../entities/car-request.entity';

export class CreateRequestDto {
  @IsNotEmpty()
  purpose: string;

  @IsNotEmpty()
  destination: string;

  @IsDateString()
  departureDateTime: Date;

  @IsOptional()
  @IsDateString()
  returnDateTime?: Date;

  @IsNumber()
  @Min(1)
  @Max(50)
  passengerCount: number;

  @IsOptional()
  @IsEnum(RequestPriority)
  priority?: RequestPriority = RequestPriority.MEDIUM;

  @IsOptional()
  additionalNotes?: string;
}
