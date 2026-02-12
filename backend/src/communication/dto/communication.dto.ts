import { IsString, IsOptional, IsBoolean } from 'class-validator';

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

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  sendLine?: boolean;
}

export class MarkAsReadDto {
  @IsString()
  notificationId: string;
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
