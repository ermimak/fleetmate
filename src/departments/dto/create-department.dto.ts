import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsUUID()
  authorityId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
