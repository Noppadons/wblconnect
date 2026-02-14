import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @Post()
  create(@Req() req: any, @Body() dto: CreatePortfolioDto) {
    return this.portfolioService.create(req.user.id, dto);
  }

  @Get('my')
  findMyItems(@Req() req: any, @Query('category') category?: string) {
    return this.portfolioService.findMyItems(req.user.id, category);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string, @Req() req: any) {
    return this.portfolioService.findByStudent(studentId, req.user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  @Put(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdatePortfolioDto) {
    return this.portfolioService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.portfolioService.remove(id, req.user.id);
  }
}
