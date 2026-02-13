import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: any, @Body() data: { avatarUrl?: string }) {
    return this.usersService.update(req.user.id, data);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() data: ChangePasswordDto) {
    await this.usersService.changePassword(req.user.id, data);
    return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }
}
