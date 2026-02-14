import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('survey')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post()
  create(@Req() req: any, @Body() dto: CreateSurveyDto) {
    return this.surveyService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.surveyService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.surveyService.findOne(id);
  }

  @Get(':id/results')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  getResults(@Param('id') id: string, @Req() req: any) {
    return this.surveyService.getResults(id, req.user.id);
  }

  @Post('respond')
  submitResponse(@Req() req: any, @Body() dto: SubmitResponseDto) {
    return this.surveyService.submitResponse(req.user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Put(':id/toggle')
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.surveyService.toggleActive(id, req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.surveyService.remove(id, req.user.id);
  }
}
