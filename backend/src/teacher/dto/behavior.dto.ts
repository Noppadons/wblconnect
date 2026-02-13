import { IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class AddBehaviorDto {
  @IsString()
  studentId: string;

  @Type(() => Number)
  @IsNumber()
  points: number;

  @IsString()
  @IsIn(['POSITIVE', 'NEGATIVE'])
  type: string;

  @IsString()
  content: string;
}
