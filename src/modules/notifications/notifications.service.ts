import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';

export class NotificationsService {
  public static async getUserNotifications(userId: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount, notifications };
  }

  public static async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) throw new NotFoundError('Notification not found');

    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
