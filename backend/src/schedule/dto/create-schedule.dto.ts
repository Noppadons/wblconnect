import { IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
    @IsString()
    dayOfWeek: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(8)
    periodStart: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(8)
    periodEnd: number;

    @IsString()
    subjectId: string;

    @IsString()
    classroomId: string;

    @IsString()
    teacherId: string;
}
