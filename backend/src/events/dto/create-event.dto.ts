import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';

export enum EventType {
  HOLIDAY = 'HOLIDAY',
  EXAM = 'EXAM',
  ACTIVITY = 'ACTIVITY',
  MEETING = 'MEETING',
  DEADLINE = 'DEADLINE',
  OTHER = 'OTHER',
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsEnum(EventType)
  type: EventType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  targetId?: string;
}
