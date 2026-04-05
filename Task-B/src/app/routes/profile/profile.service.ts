import prisma from '../../../prisma/prisma-client';
import profileMapper from './profile.utils';
import HttpException from '../../models/http-exception.model';

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


export const getProfileStats = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      _count: {
        select: {
          articles: true,
          followedBy: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const favorites = await prisma.article.findMany({
    where: { authorId: user.id },
    select: {
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  const totalFavoritesReceived = favorites.reduce(
    (sum, article) => sum + (article._count.favoritedBy ?? 0),
    0,
  );

  return {
    username,
    totalArticles: user._count.articles,
    totalFavoritesReceived,
    totalFollowers: user._count.followedBy,
    totalCommentsWritten: user._count.comments,
  };
};