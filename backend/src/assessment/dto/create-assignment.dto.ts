import { IsString, IsNumber, IsOptional, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  maxPoints: number;

  @IsString()
  subjectId: string;

  @IsOptional()
  @IsString()
  classroomId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}

export class SubmitAssignmentDto {
  @IsString()
  assignmentId: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}

export class GradeSubmissionDto {
  @IsNumber()
  points: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class BulkGradeItemDto {
  @IsString()
  studentId: string;

  @IsNumber()
  points: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class BulkGradeDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BulkGradeItemDto)
  grades?: BulkGradeItemDto[];
}
