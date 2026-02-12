import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

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
}

export class SubmitAssignmentDto {
    @IsString()
    studentId: string;

    @IsString()
    assignmentId: string;

    @IsOptional()
    @IsString()
    content?: string;
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
