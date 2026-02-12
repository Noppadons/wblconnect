import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AssessmentModule } from '../assessment/assessment.module';

@Module({
  imports: [AssessmentModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
