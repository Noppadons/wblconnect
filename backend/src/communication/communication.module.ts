import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { CommunicationController } from './communication.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LineService, NotificationService, NotificationGateway],
  controllers: [CommunicationController],
  exports: [LineService, NotificationService, NotificationGateway],
})
export class CommunicationModule {}
