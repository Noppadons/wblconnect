import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ReviewLeaveDto } from './dto/review-leave.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('leave')
@UseGuards(JwtAuthGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @Post()
  create(@Req() req: any, @Body() dto: CreateLeaveDto) {
    return this.leaveService.create(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('classroomId') classroomId?: string,
    @Query('studentId') studentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaveService.findAll({
      status,
      classroomId,
      studentId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('my-requests')
  findMyRequests(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaveService.findMyRequests(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('pending-count')
  getPendingCount(@Query('classroomId') classroomId?: string) {
    return this.leaveService.getPendingCount(classroomId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Put(':id/review')
  review(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ReviewLeaveDto,
  ) {
    return this.leaveService.review(id, req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.leaveService.cancel(id, req.user.id);
  }
}
