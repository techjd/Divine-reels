// Types representing notifications delivered to a user.
export interface NotificationItem {
  id: string;
  type:
    | 'LIKE'
    | 'COMMENT'
    | 'REPLY'
    | 'SHARE'
    | 'FOLLOW'
    | 'RANKING_CHANGE'
    | 'VIDEO_BANNED'
    | 'COMMENT_BANNED';
  entityType?: 'VIDEO' | 'COMMENT' | 'USER' | 'RANKING';
  entityId?: string;
  message: string;
  isRead: boolean;
}
