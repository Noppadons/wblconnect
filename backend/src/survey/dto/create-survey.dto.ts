import { IsString, IsOptional, IsBoolean, IsDateString, IsArray, ValidateNested, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SurveyQuestionTypeDto {
  TEXT = 'TEXT',
  CHOICE = 'CHOICE',
  RATING = 'RATING',
  YESNO = 'YESNO',
}

export class CreateSurveyQuestionDto {
  @IsString()
  text: string;

  @IsEnum(SurveyQuestionTypeDto)
  type: SurveyQuestionTypeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateSurveyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions: CreateSurveyQuestionDto[];
}
