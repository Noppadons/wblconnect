import { IsString } from 'class-validator';

export class ScanQRDto {
  @IsString()
  code: string;
}
