import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async createNotification(data: { title: string; content: string; type: string; targetId?: string }) {
        return this.prisma.notification.create({
            data
        });
    }

    async getNotifications(targetId?: string) {
        return this.prisma.notification.findMany({
            where: {
                OR: [
                    { targetId: null }, // Global
                    { targetId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    }

    async deleteNotification(id: string) {
        return this.prisma.notification.delete({
            where: { id }
        });
    }
}
