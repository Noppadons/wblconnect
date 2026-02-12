import { IsString, IsEnum, IsInt, IsOptional, Min, Max, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class CheckAttendanceDto {
    @IsString()
    studentId: string;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsInt()
    @Min(0)
    @Max(8)
    period: number;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsOptional()
    @IsDateString()
    date?: string;
}

export class BulkCheckAttendanceDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CheckAttendanceDto)
    records: CheckAttendanceDto[];
}
