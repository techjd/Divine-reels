import { prisma } from '../../config/prisma';
import { GodDetail, PaginatedGods } from './god.types';

// Service encapsulates database access for gods.
export const godService = {
  listGods: async (params: { page: number; pageSize: number; languageCode: string }): Promise<PaginatedGods> => {
    const { page, pageSize, languageCode } = params;
    const where = { isActive: true };
    const skip = (page - 1) * pageSize;

    const [total, gods] = await Promise.all([
      prisma.god.count({ where }),
      prisma.god.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { followerCount: 'desc' },
        include: {
          translations: {
            where: { languageCode },
            select: { name: true, description: true },
            take: 1
          }
        }
      })
    ]);

    const items: GodDetail[] = gods.map((god) => {
      const translation = god.translations[0];
      return {
        id: god.id,
        slug: god.slug,
        name: translation?.name ?? god.slug,
        description: translation?.description ?? undefined,
        imageUrl: god.imageUrl ?? undefined,
        followerCount: god.followerCount
      };
    });

    const hasMore = page * pageSize < total;

    return { items, page, pageSize, total, hasMore };
  },

  getGodById: async (id: string, languageCode = 'en'): Promise<GodDetail | null> => {
    const god = await prisma.god.findUnique({
      where: { id },
      include: {
        translations: {
          where: { languageCode },
          select: { name: true, description: true },
          take: 1
        }
      }
    });

    if (!god || !god.isActive) {
      return null;
    }

    const translation = god.translations[0];
    return {
      id: god.id,
      slug: god.slug,
      name: translation?.name ?? god.slug,
      description: translation?.description ?? undefined,
      imageUrl: god.imageUrl ?? undefined,
      followerCount: god.followerCount
    };
  }
};
