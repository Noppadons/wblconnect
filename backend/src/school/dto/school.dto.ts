import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  credit: number;

  @IsString()
  classroomId: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  credit?: number;

  @IsOptional()
  @IsString()
  classroomId?: string;

  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsString()
  subjectId: string;

  @IsString()
  teacherId: string;
}
