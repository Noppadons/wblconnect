import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Headers,
  RawBody,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { LineService } from './line.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateNotificationDto,
  MarkAsReadDto,
  BroadcastLineDto,
  TestLineDto,
} from './dto/communication.dto';

@Controller('communication')
export class CommunicationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly lineService: LineService,
  ) { }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Req() req: any,
    @Query('targetId') targetId?: string,
  ) {
    const sanitizedTargetId =
      targetId === 'undefined' || !targetId ? null : targetId;
    return this.notificationService.getNotifications(
      req.user.id,
      sanitizedTargetId,
    );
  }

  @Get('notifications/unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(
    @Req() req: any,
    @Query('targetId') targetId?: string,
  ) {
    const sanitizedTargetId =
      targetId === 'undefined' || !targetId ? null : targetId;
    const count = await this.notificationService.getUnreadCount(
      req.user.id,
      sanitizedTargetId,
    );
    return { count };
  }

  @Post('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('notifications')
  async createNotification(@Body() data: CreateNotificationDto) {
    return this.notificationService.createNotification(data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('notifications/:id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('test-broadcast-line')
  async testBroadcastLine(@Body() data: BroadcastLineDto) {
    const msg =
      data.message ||
      '🔔 ทดสอบการแจ้งเตือนแบบ Broadcast จากระบบ WBL Connect ครับ';
    try {
      await this.lineService.broadcastMessage(msg);
      return { success: true, message: 'Broadcast sent successfully' };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Line Broadcast API Error');
    }
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('test-line')
  async testLineMessage(@Body() data: TestLineDto) {
    if (!data.to) return { success: false, message: 'Missing "to" parameter' };

    try {
      await this.lineService.sendMessage(
        data.to,
        '🔔 ทดสอบการแจ้งเตือนรายบุคคลจาก WBL Connect ครับ',
      );
      return { success: true };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Line API Error');
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('x-line-signature') signature: string,
    @RawBody() rawBody: Buffer,
    @Body() body: any,
  ) {
    if (!signature || !rawBody) {
      return { success: false, message: 'Missing signature or body' };
    }

    const isValid = this.lineService.verifySignature(
      signature,
      rawBody.toString(),
    );
    if (!isValid) {
      console.warn('[Webhook] Invalid signature received');
      return { success: false, message: 'Invalid signature' };
    }

    // Process webhook events (extend as needed)
    return { success: true };
  }
}
