import { AppError } from '../../core/errors/AppError';
import { prisma } from '../../config/prisma';
import {
  GetUserGodsQuery,
  GodDto,
  UpdateUserGodsBody,
  UserProfile
} from './user.types';

// Service placeholder for user profile lookup and god selection management.
export const userService = {
  getUserProfile: async (id: string): Promise<UserProfile | null> => {
    if (id === 'mock-user-id') {
      return {
        id,
        displayName: 'Demo User',
        bio: 'Loves divine reels',
        followersCount: 5,
        followingCount: 10
      };
    }
    return null;
  },

  // Returns the current user's selected gods with translation for languageCode.
  getUserSelectedGods: async (
    params: { userId: string } & GetUserGodsQuery
  ): Promise<{ items: GodDto[]; languageCode: string }> => {
    const { userId, languageCode } = params;

    const follows = await prisma.userGodFollow.findMany({
      where: { userId },
      select: { godId: true }
    });

    const godIds = follows.map((f) => f.godId);
    if (godIds.length === 0) {
      return { items: [], languageCode };
    }

    const gods = await prisma.god.findMany({
      where: { id: { in: godIds }, isActive: true },
      include: {
        translations: {
          where: { languageCode },
          select: { name: true, description: true },
          take: 1
        }
      }
    });

    // Translation fallback could be added here if no record exists; for now we return null values.
    const items: GodDto[] = gods.map((god) => {
      const translation = god.translations[0];
      return {
        id: god.id,
        slug: god.slug,
        name: translation?.name ?? null,
        description: translation?.description ?? null,
        imageUrl: god.imageUrl ?? null,
        followerCount: god.followerCount
      };
    });

    return { items, languageCode };
  },

  // Replaces the user's selected gods atomically for idempotence.
  setUserSelectedGods: async (
    params: { userId: string } & UpdateUserGodsBody & GetUserGodsQuery
  ): Promise<{ items: GodDto[]; languageCode: string }> => {
    const { userId, godIds, languageCode } = params;

    // Deduplicate to avoid duplicate inserts.
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

    // Fetch current selections to compute adds/removes for follower counts.
    const currentLinks = await prisma.userGodFollow.findMany({
      where: { userId },
      select: { godId: true }
    });
    const currentIds = new Set(currentLinks.map((l) => l.godId));
    const newIds = new Set(uniqueGodIds);
    const addedGodIds = Array.from(newIds).filter((id) => !currentIds.has(id));
    const removedGodIds = Array.from(currentIds).filter((id) => !newIds.has(id));

    // Replace selection and adjust follower counts atomically. We compute adds/removes to keep followerCount in sync.
    await prisma.$transaction([
      prisma.userGodFollow.deleteMany({ where: { userId } }),
      prisma.userGodFollow.createMany({
        data: uniqueGodIds.map((id) => ({ userId, godId: id }))
      }),
      addedGodIds.length
        ? prisma.god.updateMany({
            where: { id: { in: addedGodIds } },
            data: { followerCount: { increment: 1 } }
          })
        : prisma.god.findMany({ where: { id: { in: [] } } }), // no-op placeholder
      removedGodIds.length
        ? prisma.god.updateMany({
            where: { id: { in: removedGodIds } },
            data: { followerCount: { decrement: 1 } }
          })
        : prisma.god.findMany({ where: { id: { in: [] } } }) // no-op placeholder
    ]);

    return userService.getUserSelectedGods({ userId, languageCode });
  }
};
