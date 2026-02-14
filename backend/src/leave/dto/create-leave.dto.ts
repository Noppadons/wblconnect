import { IsString, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';

export enum LeaveType {
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER',
}

export class CreateLeaveDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  reason: string;

  @IsEnum(LeaveType)
  type: LeaveType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
