import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) { }

    @Get('my-schedule')
    findMySchedule(@Req() req: any) {
        return this.scheduleService.findMySchedule(req.user);
    }

    @Get('all')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    findAll() {
        return this.scheduleService.findAll();
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    create(@Body() data: CreateScheduleDto) {
        return this.scheduleService.create(data);
    }

    @Get('classroom/:id')
    findByClassroom(@Param('id') id: string) {
        return this.scheduleService.findByClassroom(id);
    }

    @Get('teacher/:id')
    findByTeacher(@Param('id') id: string) {
        return this.scheduleService.findByTeacher(id);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.scheduleService.remove(id);
    }
}
