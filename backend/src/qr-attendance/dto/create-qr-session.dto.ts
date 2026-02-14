import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateQRSessionDto {
  @IsString()
  classroomId: string;

  @IsInt()
  @Min(0)
  @Max(8)
  period: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationMinutes?: number; // default 5 minutes
}
