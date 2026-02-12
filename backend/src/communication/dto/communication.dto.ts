import { IsString, IsOptional } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    targetId?: string;
}

export class BroadcastLineDto {
    @IsOptional()
    @IsString()
    message?: string;
}

export class TestLineDto {
    @IsString()
    to: string;
}
