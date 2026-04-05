import prisma from '../../../prisma/prisma-client';
import profileMapper from './profile.utils';
import HttpException from '../../models/http-exception.model';

interface ProfileStats {
  articlesCount: number;
  favoritesReceived: number;
  followersCount: number;
  commentsCount: number;
}

export const getProfile = async (usernamePayload: string, id?: number) => {
  const profile = await prisma.user.findUnique({
    where: {
      username: usernamePayload,
    },
    include: {
      followedBy: true,
    },
  });

  if (!profile) {
    throw new HttpException(404, {});
  }

  return profileMapper(profile, id);
};

export const followUser = async (usernamePayload: string, id: number) => {
  const profile = await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      followedBy: {
        connect: {
          id,
        },
      },
    },
    include: {
      followedBy: true,
    },
  });

  return profileMapper(profile, id);
};

export const unfollowUser = async (usernamePayload: string, id: number) => {
  const profile = await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      followedBy: {
        disconnect: {
          id,
        },
      },
    },
    include: {
      followedBy: true,
    },
  });

  return profileMapper(profile, id);
};

export async function getProfileStats(username: string): Promise<ProfileStats> {
  // Verify the user exists first — throws a typed error the
  // existing error-handling middleware can catch and map to 404.
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) {
    const error = new Error('User not found');
    (error as any).status = 404;
    throw error;
  }

  // Run all four stat queries in parallel — no query depends on
  // another's result, so there is no reason to await sequentially.
  const [articlesCount, favoritesReceived, followersCount, commentsCount] =
    await Promise.all([
      // Total articles published by this user.
      prisma.article.count({
        where: { authorId: user.id },
      }),

      // Total favourites received: sum the length of each article's
      // favoritedBy relation. Prisma doesn't expose a cross-relation
      // aggregate here, so we select the counts per article and reduce.
      prisma.article.findMany({
        where: { authorId: user.id },
        select: {
          _count: {
            select: { favoritedBy: true },
          },
        },
      }),

      // Total followers of this user.
      prisma.user.count({
        where: {
          following: {
            some: { id: user.id },
          },
        },
      }),

      // Total comments written by this user.
      prisma.comment.count({
        where: { authorId: user.id },
      }),
    ]);

  // favoritesReceived is still the raw findMany result at this point —
  // reduce it to a single integer before returning.
  const totalFavoritesReceived = (
    favoritesReceived as Array<{ _count: { favoritedBy: number } }>
  ).reduce((sum, article) => sum + article._count.favoritedBy, 0);

  return {
    articlesCount,
    favoritesReceived: totalFavoritesReceived,
    followersCount,
    commentsCount,
  };
}
