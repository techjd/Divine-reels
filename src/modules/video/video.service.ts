import { LikeEntityType } from '@prisma/client';
import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';
import {
  CreateVideoBody,
  GetFeedQuery,
  GetVideoByIdParams,
  GodRefDto,
  UploaderDto,
  VideoDto
} from './video.types';

export type DailyTopMetric = 'all' | 'likes' | 'comments' | 'views' | 'shares';

export interface VideoSummaryDto {
  id: string;
  caption: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
}

export interface DailyTopVideoItem {
  video: VideoSummaryDto;
  todayCount: number;
}

export interface DailyTopVideosResult {
  topLiked?: DailyTopVideoItem[];
  topCommented?: DailyTopVideoItem[];
  topViewed?: DailyTopVideoItem[];
  topShared?: DailyTopVideoItem[];
  page: number;
  limit: number;
  hasMore: boolean;
}

// Maps Prisma video payload to DTO with uploader and god references.
const mapVideoToDto = (video: any): VideoDto => {
  const gods: GodRefDto[] =
    video.videoGods?.map((vg: any) => ({ id: vg.god.id, slug: vg.god.slug })) ?? [];
  const uploader: UploaderDto | undefined = video.uploader
    ? { id: video.uploader.id, displayName: video.uploader.displayName ?? null }
    : undefined;

  return {
    id: video.id,
    caption: video.caption ?? null,
    videoUrl: video.videoUrl,
    thumbnailUrl: video.thumbnailUrl ?? null,
    likeCount: video.likeCount,
    commentCount: video.commentCount,
    viewCount: video.viewCount,
    shareCount: video.shareCount,
    durationSeconds: video.durationSeconds,
    uploaderId: video.uploaderId,
    createdAt: video.createdAt,
    gods,
    uploader
  };
};

const mapVideoToSummary = (video: any): VideoSummaryDto => ({
  id: video.id,
  caption: video.caption ?? null,
  videoUrl: video.videoUrl,
  thumbnailUrl: video.thumbnailUrl ?? null,
  durationSeconds: video.durationSeconds,
  viewCount: video.viewCount,
  likeCount: video.likeCount,
  commentCount: video.commentCount,
  shareCount: video.shareCount,
  createdAt: video.createdAt
});

// Computes the IST start/end of "today" for daily leaderboards.
const getTodayRangeIst = () => {
  // NOTE: This relies on the execution environment's local time being set to IST.
  const now = new Date();
  
  // 1. Calculate the start time: Today at 00:00:00 IST
  // When Date is called with Y, M, D, H, etc., it uses the LOCAL timezone (IST).
  const start = new Date(
    now.getFullYear(), 
    now.getMonth(), 
    now.getDate(), 
    0, 0, 0, 0
  );
  
  // 2. Calculate the end time: Tomorrow at 00:00:00 IST
  const end = new Date(
    now.getFullYear(), 
    now.getMonth(), 
    now.getDate() + 1, 
    0, 0, 0, 0
  );
  
  // The returned Date objects (start and end) inherently contain their correct UTC timestamp.
  return { start, end };
};

export const videoService = {
  createVideo: async (
    params: { userId: string } & CreateVideoBody
  ): Promise<VideoDto> => {
    const { userId, caption = null, videoUrl, thumbnailUrl, durationSeconds, godIds } = params;

    // TODO: In the future, verify durationSeconds server-side using a media probe (ffmpeg/ffprobe).
    if (durationSeconds <= 0 || durationSeconds > 60) {
      throw new AppError('Video duration must be between 1 and 60 seconds.', {
        statusCode: 400,
        code: 'INVALID_DURATION'
      });
    }

    // Validate provided god IDs against active gods when supplied.
    let validGodIds: string[] = [];
    if (godIds && godIds.length > 0) {
      const uniqueGodIds = Array.from(new Set(godIds));
      const activeGods = await prisma.god.findMany({
        where: { id: { in: uniqueGodIds }, isActive: true },
        select: { id: true }
      });
      const activeIds = new Set(activeGods.map((g) => g.id));
      const invalidIds = uniqueGodIds.filter((id) => !activeIds.has(id));

      if (invalidIds.length > 0) {
        throw new AppError('Some gods are invalid or inactive', {
          statusCode: 400,
          code: 'INVALID_GOD_IDS',
          details: { invalidIds }
        });
      }
      validGodIds = uniqueGodIds;
    }

    console.log("User Id is ",userId)

    const video = await prisma.video.create({
      data: {
        uploaderId: userId,
        caption,
        videoUrl,
        thumbnailUrl,
        durationSeconds,
        videoGods:
          validGodIds.length > 0
            ? {
                createMany: {
                  data: validGodIds.map((godId) => ({ godId }))
                }
              }
            : undefined // TODO: attach to a generic "other" god when defined.
      },
      include: {
        videoGods: { include: { god: { select: { id: true, slug: true } } } },
        uploader: { select: { id: true, displayName: true } }
      }
    });

    return mapVideoToDto(video);
  },

  getVideoById: async ({ id }: GetVideoByIdParams): Promise<VideoDto | null> => {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        videoGods: { include: { god: { select: { id: true, slug: true } } } },
        uploader: { select: { id: true, displayName: true } }
      }
    });

    if (!video || video.isBanned) {
      return null;
    }

    return mapVideoToDto(video);
  },

  getVideoFeed: async (
    params: { userId: string } & GetFeedQuery
  ): Promise<{ items: VideoDto[]; page: number; pageSize: number; total: number; hasMore: boolean }> => {
    const { userId, page, pageSize } = params;

    const selectedGods = await prisma.userGodFollow.findMany({
      where: { userId },
      select: { godId: true }
    });
    const selectedGodIds = selectedGods.map((g) => g.godId);

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const preferredVideos = selectedGodIds.length
      ? await prisma.video.findMany({
          where: {
            isBanned: false,
            videoGods: { some: { godId: { in: selectedGodIds } } }
          },
          orderBy: { createdAt: 'desc' },
          include: {
            videoGods: { include: { god: { select: { id: true, slug: true } } } },
            uploader: { select: { id: true, displayName: true } }
          },
          skip,
          take
        })
      : [];

    const preferredIds = new Set(preferredVideos.map((v) => v.id));

    // If not enough, fill with other non-banned videos (excluding already selected IDs).
    let supplementalVideos: any[] = [];
    if (preferredVideos.length < take) {
      const remaining = take - preferredVideos.length;
      supplementalVideos = await prisma.video.findMany({
        where: {
          isBanned: false,
          id: { notIn: Array.from(preferredIds) }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          videoGods: { include: { god: { select: { id: true, slug: true } } } },
          uploader: { select: { id: true, displayName: true } }
        },
        skip: preferredVideos.length > 0 ? 0 : skip,
        take: remaining
      });
    }

    const videosCombined = [...preferredVideos, ...supplementalVideos];
    const items = videosCombined.map(mapVideoToDto);

    const total = await prisma.video.count({ where: { isBanned: false } });
    const hasMore = page * pageSize < total;

    return { items, page, pageSize, total, hasMore };
  },

  // Also logs a VideoView event for daily analytics (e.g., "top videos of the day").
  // Lightweight counters for MVP; not perfectly precise under heavy concurrency.
  // TODO: Track per-user view/share events to avoid double-counting and consider a write-optimized store (Redis/Kafka) when scaling.
  incrementViewCount: async (
    videoId: string
  ): Promise<{ id: string; viewCount: number }> => {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, isBanned: true }
    });

    if (!video || video.isBanned) {
      throw new AppError('Video not found or unavailable.', {
        statusCode: 404,
        code: 'VIDEO_NOT_FOUND'
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.video.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
        select: { id: true, viewCount: true }
      });

      await tx.videoView.create({
        data: { videoId }
      });

      return result;
    });

    return updated;
  },

  // Also logs a VideoShare event for daily analytics (e.g., "top videos of the day").
  // Lightweight counters for MVP; not perfectly precise under heavy concurrency.
  incrementShareCount: async (
    videoId: string
  ): Promise<{ id: string; shareCount: number }> => {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, isBanned: true }
    });

    if (!video || video.isBanned) {
      throw new AppError('Video not found or unavailable.', {
        statusCode: 404,
        code: 'VIDEO_NOT_FOUND'
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.video.update({
        where: { id: videoId },
        data: { shareCount: { increment: 1 } },
        select: { id: true, shareCount: true }
      });

      await tx.videoShare.create({
        data: { videoId }
      });

      return result;
    });

    return updated;
  },

  getDailyTopVideos: async (
    metric: DailyTopMetric,
    page: number,
    limit: number
  ): Promise<DailyTopVideosResult> => {
    const { start, end } = getTodayRangeIst();
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit > 100 ? 100 : limit < 1 ? 10 : limit;
    const offset = (safePage - 1) * safeLimit;

    type AggregatedCount = { videoId: string; count: number };

    const buildTopItems = async (
      aggregated: AggregatedCount[]
    ): Promise<{ items: DailyTopVideoItem[]; total: number; hasMore: boolean }> => {
      if (aggregated.length === 0) {
        return { items: [], total: 0, hasMore: false };
      }

      const videoIds = Array.from(new Set(aggregated.map((a) => a.videoId)));
      const videos = await prisma.video.findMany({
        where: { id: { in: videoIds }, isBanned: false },
        select: {
          id: true,
          caption: true,
          videoUrl: true,
          thumbnailUrl: true,
          durationSeconds: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          shareCount: true,
          createdAt: true
        }
      });
      const videoMap = new Map<string, VideoSummaryDto>(
        videos.map((v) => [v.id, mapVideoToSummary(v)])
      );

      const filtered = aggregated.filter((a) => videoMap.has(a.videoId));
      const total = filtered.length;
      const paged = filtered.slice(offset, offset + safeLimit);
      const items: DailyTopVideoItem[] = paged.map((a) => ({
        video: videoMap.get(a.videoId)!,
        todayCount: a.count
      }));

      return { items, total, hasMore: offset + safeLimit < total };
    };

    const result: DailyTopVideosResult = {
      page: safePage,
      limit: safeLimit,
      hasMore: false
    };

    let hasMoreFlags: boolean[] = [];

    if (metric === 'likes' || metric === 'all') {
      const likesAgg = await prisma.like.groupBy({
        by: ['entityId'],
        where: {
          createdAt: { gte: start, lt: end },
          entityType: LikeEntityType.VIDEO
        },
        _count: { _all: true },
        orderBy: { _count: { entityId: 'desc' } }
      });
      const mapped: AggregatedCount[] = likesAgg.map((l) => ({
        videoId: l.entityId,
        count: l._count._all
      }));
      const { items, hasMore } = await buildTopItems(mapped);
      result.topLiked = items;
      hasMoreFlags.push(hasMore);
    }

    if (metric === 'comments' || metric === 'all') {
      const commentsAgg = await prisma.comment.groupBy({
        by: ['videoId'],
        where: {
          createdAt: { gte: start, lt: end },
          isBanned: false
        },
        _count: { _all: true },
        orderBy: { _count: { videoId: 'desc' } }
      });
      const mapped: AggregatedCount[] = commentsAgg.map((c) => ({
        videoId: c.videoId,
        count: c._count._all
      }));
      const { items, hasMore } = await buildTopItems(mapped);
      result.topCommented = items;
      hasMoreFlags.push(hasMore);
    }

    if (metric === 'views' || metric === 'all') {
      const viewsAgg = await prisma.videoView.groupBy({
        by: ['videoId'],
        where: { createdAt: { gte: start, lt: end } },
        _count: { _all: true },
        orderBy: { _count: { videoId: 'desc' } }
      });
      const mapped: AggregatedCount[] = viewsAgg.map((v) => ({
        videoId: v.videoId,
        count: v._count._all
      }));
      const { items, hasMore } = await buildTopItems(mapped);
      result.topViewed = items;
      hasMoreFlags.push(hasMore);
    }

    if (metric === 'shares' || metric === 'all') {
      const sharesAgg = await prisma.videoShare.groupBy({
        by: ['videoId'],
        where: { createdAt: { gte: start, lt: end } },
        _count: { _all: true },
        orderBy: { _count: { videoId: 'desc' } }
      });
      const mapped: AggregatedCount[] = sharesAgg.map((s) => ({
        videoId: s.videoId,
        count: s._count._all
      }));
      const { items, hasMore } = await buildTopItems(mapped);
      result.topShared = items;
      hasMoreFlags.push(hasMore);
    }

    // For "all", hasMore is true if any leaderboard has more pages remaining.
    result.hasMore = hasMoreFlags.some(Boolean);
    return result;
  }
};
