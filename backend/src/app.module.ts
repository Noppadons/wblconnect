import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolModule } from './school/school.module';
import { StudentsModule } from './students/students.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssessmentModule } from './assessment/assessment.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { CommunicationModule } from './communication/communication.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TeacherModule } from './teacher/teacher.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SchoolModule,
    StudentsModule,
    AttendanceModule,
    AssessmentModule,
    ReportsModule,
    AdminModule,
    CommunicationModule,
    AnalyticsModule,
    ScheduleModule,
    TeacherModule,
    UploadModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
