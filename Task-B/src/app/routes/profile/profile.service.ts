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


export async function getProfileStats(username: string, currentUserId?: number) {
  // First, verify the user exists
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      articles: {
        include: {
          favoritedBy: true,
          comments: true,
        },
      },
      followedBy: true,
      comments: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate statistics
  const totalArticles = user.articles.length;

  // Count total favorites received across all articles
  const totalFavoritesReceived = user.articles.reduce((total, article) => {
    return total + article.favoritedBy.length;
  }, 0);

  const totalFollowers = user.followedBy.length;

  // Count total comments written by the user
  const totalCommentsWritten = user.comments.length;

  // Optional: Check if current user is following this user
  let isFollowing = false;
  if (currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        following: {
          where: { id: user.id },
        },
      },
    });
    isFollowing = currentUser?.following.length > 0;
  }

  return {
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: isFollowing,
      stats: {
        totalArticles,
        totalFavoritesReceived,
        totalFollowers,
        totalCommentsWritten,
      },
    },
  };
}
