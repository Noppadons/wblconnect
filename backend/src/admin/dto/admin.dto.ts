import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateStudentDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(4)
    password?: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    studentCode: string;

    @IsOptional()
    @IsString()
    classroomId?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    parentLineToken?: string;
}

export class UpdateStudentDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    studentCode?: string;

    @IsOptional()
    @IsString()
    classroomId?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsString()
    parentLineToken?: string;
}

export class CreateTeacherDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(4)
    password?: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}

export class UpdateTeacherDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}

export class CreateClassroomDto {
    @IsString()
    semesterId: string;

    @IsString()
    gradeLevel: string;

    @IsString()
    roomNumber: string;

    @IsOptional()
    @IsString()
    homeroomTeacherId?: string;
}

export class UpdateClassroomDto {
    @IsOptional()
    @IsString()
    roomNumber?: string;

    @IsOptional()
    @IsString()
    homeroomTeacherId?: string;

    @IsOptional()
    @IsString()
    lineToken?: string;
}

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    website?: string;
}
