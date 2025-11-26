import { NotificationItem } from './notification.types';

// Service placeholder for notification retrieval.
export const notificationService = {
  listForUser: async (userId: string): Promise<NotificationItem[]> => {
    return [
      {
        id: 'notif-1',
        type: 'LIKE',
        entityType: 'VIDEO',
        entityId: 'video-1',
        message: `${userId} received a like`,
        isRead: false
      }
    ];
  }
};
