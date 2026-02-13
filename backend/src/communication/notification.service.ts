import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LineService } from './line.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private lineService: LineService,
  ) {}

  async createNotification(data: {
    title: string;
    content: string;
    type: string;
    targetId?: string;
    imageUrl?: string;
    isPinned?: boolean;
    expiresAt?: string;
    sendLine?: boolean;
  }) {
    const { sendLine, expiresAt, ...rest } = data;

    const notification = await this.prisma.notification.create({
      data: {
        ...rest,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    if (sendLine) {
      try {
        const lineMsg = [
          `━━━━━━━━━━━━━━━`,
          `� ประกาศจากโรงเรียน`,
          `━━━━━━━━━━━━━━━`,
          `📌 ${data.title}`,
          ``,
          `${data.content}`,
          ``,
          `━━━━━━━━━━━━━━━`,
          `🏫 WBL Connect`,
        ].join('\n');
        await this.lineService.broadcastMessage(lineMsg);
      } catch (err) {
        this.logger.warn(`Failed to send LINE broadcast: ${(err as Error).message}`);
      }
    }

    return notification;
  }

  async getNotifications(userId: string, targetId?: string | null) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { targetId: null }, // Global
              { targetId },
            ],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
      include: {
        readBy: {
          where: { userId },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    });

    // Map to include a simple 'isRead' boolean for the frontend
    return notifications.map((n) => ({
      ...n,
      isRead: n.readBy.length > 0 && n.readBy[0].isRead,
    }));
  }

  async markAsRead(notificationId: string, userId: string) {
    if (!notificationId || !userId) {
      throw new BadRequestException('NotificationId and UserId are required');
    }

    return this.prisma.userNotification.upsert({
      where: {
        userId_notificationId: { userId, notificationId },
      },
      update: {
        isRead: true,
        readAt: new Date(),
      },
      create: {
        userId,
        notificationId,
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string, targetId?: string | null) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [{ targetId: null }, { targetId }],
          },
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          {
            readBy: {
              none: { userId, isRead: true },
            },
          },
        ],
      },
    });
    return notifications.length;
  }

  async deleteNotification(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
