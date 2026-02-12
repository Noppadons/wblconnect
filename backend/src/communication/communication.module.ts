import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { NotificationService } from './notification.service';
import { CommunicationController } from './communication.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LineService, NotificationService],
  controllers: [CommunicationController],
  exports: [LineService, NotificationService],
})
export class CommunicationModule {}
