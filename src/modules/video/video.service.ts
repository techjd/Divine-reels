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
    durationSeconds: video.durationSeconds,
    uploaderId: video.uploaderId,
    createdAt: video.createdAt,
    gods,
    uploader
  };
};

export const videoService = {
  createVideo: async (
    params: { userId: string } & CreateVideoBody
  ): Promise<VideoDto> => {
    const { userId, caption = null, videoUrl, thumbnailUrl = null, durationSeconds, godIds } = params;

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
  }
};
