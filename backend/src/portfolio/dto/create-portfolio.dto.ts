import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';

export enum PortfolioCategoryDto {
  AWARD = 'AWARD',
  ACTIVITY = 'ACTIVITY',
  PROJECT = 'PROJECT',
  CERTIFICATE = 'CERTIFICATE',
  VOLUNTEER = 'VOLUNTEER',
  OTHER = 'OTHER',
}

export class CreatePortfolioDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PortfolioCategoryDto)
  category: PortfolioCategoryDto;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
