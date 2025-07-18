import { IsNotEmpty, IsEmail, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateDriverDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  licenseNumber: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsDateString()
  licenseExpiryDate: Date;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;
}
