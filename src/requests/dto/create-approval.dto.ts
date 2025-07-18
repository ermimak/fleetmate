import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApprovalType } from '../entities/approval.entity';

export class CreateApprovalDto {
  @IsNotEmpty()
  requestId: string;

  @IsNotEmpty()
  approverId: string;

  @IsEnum(ApprovalType)
  type: ApprovalType;
}
