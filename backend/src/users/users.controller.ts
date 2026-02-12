import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req) {
        return this.usersService.findById(req.user.id);
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    updateProfile(@Request() req, @Body() data: { avatarUrl?: string }) {
        return this.usersService.update(req.user.id, data);
    }
}
