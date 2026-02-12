import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { LineService } from './line.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateNotificationDto, BroadcastLineDto, TestLineDto } from './dto/communication.dto';

@Controller('communication')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly lineService: LineService
    ) { }

    @Get('notifications')
    async getNotifications(@Query('targetId') targetId?: string) {
        return this.notificationService.getNotifications(targetId);
    }

    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post('notifications')
    async createNotification(@Body() data: CreateNotificationDto) {
        return this.notificationService.createNotification(data);
    }

    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @Delete('notifications/:id')
    async deleteNotification(@Param('id') id: string) {
        return this.notificationService.deleteNotification(id);
    }

    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post('test-broadcast-line')
    async testBroadcastLine(@Body() data: BroadcastLineDto) {
        const msg = data.message || '🔔 ทดสอบการแจ้งเตือนแบบ Broadcast จากระบบ WBL Connect ครับ';
        try {
            await this.lineService.broadcastMessage(msg);
            return { success: true, message: 'Broadcast sent successfully' };
        } catch (error) {
            throw new Error('Line Broadcast API Error');
        }
    }

    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    @Post('test-line')
    async testLineMessage(@Body() data: TestLineDto) {
        if (!data.to) return { success: false, message: 'Missing "to" parameter' };

        try {
            await this.lineService.sendMessage(data.to, '🔔 ทดสอบการแจ้งเตือนรายบุคคลจาก WBL Connect ครับ');
            return { success: true };
        } catch (error) {
            throw new Error('Line API Error');
        }
    }
}
