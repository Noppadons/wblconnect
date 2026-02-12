import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SchoolModule } from '../school/school.module';

@Module({
  imports: [SchoolModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
