import slugify from 'slugify';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import profileMapper from '../profile/profile.utils';
import articleMapper from './article.mapper';
import { Tag } from '../tag/tag.model';
import { Article, User } from '@prisma/client';

/**
 * The shaped article returned to the client — matches whatever your existing
 * formatArticle() / toArticleResponse() helper produces. Adjust as needed.
 */
type ArticleWithMeta = Article & {
  author: Pick<User, 'username' | 'image' | 'bio'>;
  tagList: { name: string }[];
  _count: { favoritedBy: number };
  isBookmarked: boolean;
  isFavorited: boolean;
};


const buildFindAllQuery = (query: any, id: number | undefined) => {
  const queries: any = [];
  const orAuthorQuery = [];
  const andAuthorQuery = [];

  orAuthorQuery.push({
    demo: {
      equals: true,
    },
  });

  if (id) {
    orAuthorQuery.push({
      id: {
        equals: id,
      },
    });
  }

  if ('author' in query) {
    andAuthorQuery.push({
      username: {
        equals: query.author,
      },
    });
  }

  const authorQuery = {
    author: {
      OR: orAuthorQuery,
      AND: andAuthorQuery,
    },
  };

  queries.push(authorQuery);

  if ('tag' in query) {
    queries.push({
      tagList: {
        some: {
          name: query.tag,
        },
      },
    });
  }

  if ('favorited' in query) {
    queries.push({
      favoritedBy: {
        some: {
          username: {
            equals: query.favorited,
          },
        },
      },
    });
  }

  return queries;
};

export const getArticles = async (query: any, id?: number) => {
  const andQueries = buildFindAllQuery(query, id);
  const articlesCount = await prisma.article.count({
    where: {
      AND: andQueries,
    },
  });

  const articles = await prisma.article.findMany({
    where: { AND: andQueries },
    orderBy: {
      createdAt: 'desc',
    },
    skip: Number(query.offset) || 0,
    take: Number(query.limit) || 10,
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return {
    articles: articles.map((article: any) => articleMapper(article, id)),
    articlesCount,
  };
};

export const getFeed = async (offset: number, limit: number, id: number) => {
  const articlesCount = await prisma.article.count({
    where: {
      author: {
        followedBy: { some: { id: id } },
      },
    },
  });

  const articles = await prisma.article.findMany({
    where: {
      author: {
        followedBy: { some: { id: id } },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: offset || 0,
    take: limit || 10,
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return {
    articles: articles.map((article: any) => articleMapper(article, id)),
    articlesCount,
  };
};

export const createArticle = async (article: any, id: number) => {
  const { title, description, body, tagList } = article;
  const tags = Array.isArray(tagList) ? tagList : [];

  if (!title) {
    throw new HttpException(422, { errors: { title: ["can't be blank"] } });
  }

  if (!description) {
    throw new HttpException(422, { errors: { description: ["can't be blank"] } });
  }

  if (!body) {
    throw new HttpException(422, { errors: { body: ["can't be blank"] } });
  }

  const slug = `${slugify(title)}-${id}`;

  const existingTitle = await prisma.article.findUnique({
    where: {
      slug,
    },
    select: {
      slug: true,
    },
  });

  if (existingTitle) {
    throw new HttpException(422, { errors: { title: ['must be unique'] } });
  }

  const {
    authorId,
    id: articleId,
    ...createdArticle
  } = await prisma.article.create({
    data: {
      title,
      description,
      body,
      slug,
      tagList: {
        connectOrCreate: tags.map((tag: string) => ({
          create: { name: tag },
          where: { name: tag },
        })),
      },
      author: {
        connect: {
          id: id,
        },
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return articleMapper(createdArticle, id);
};

export const getArticle = async (slug: string, id?: number) => {
  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  return articleMapper(article, id);
};

const disconnectArticlesTags = async (slug: string) => {
  await prisma.article.update({
    where: {
      slug,
    },
    data: {
      tagList: {
        set: [],
      },
    },
  });
};

export const updateArticle = async (article: any, slug: string, id: number) => {
  let newSlug = null;

  const existingArticle = await await prisma.article.findFirst({
    where: {
      slug,
    },
    select: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!existingArticle) {
    throw new HttpException(404, {});
  }

  if (existingArticle.author.id !== id) {
    throw new HttpException(403, {
      message: 'You are not authorized to update this article',
    });
  }

  if (article.title) {
    newSlug = `${slugify(article.title)}-${id}`;

    if (newSlug !== slug) {
      const existingTitle = await prisma.article.findFirst({
        where: {
          slug: newSlug,
        },
        select: {
          slug: true,
        },
      });

      if (existingTitle) {
        throw new HttpException(422, { errors: { title: ['must be unique'] } });
      }
    }
  }

  const tagList =
    Array.isArray(article.tagList) && article.tagList?.length
      ? article.tagList.map((tag: string) => ({
        create: { name: tag },
        where: { name: tag },
      }))
      : [];

  await disconnectArticlesTags(slug);

  const updatedArticle = await prisma.article.update({
    where: {
      slug,
    },
    data: {
      ...(article.title ? { title: article.title } : {}),
      ...(article.body ? { body: article.body } : {}),
      ...(article.description ? { description: article.description } : {}),
      ...(newSlug ? { slug: newSlug } : {}),
      updatedAt: new Date(),
      tagList: {
        connectOrCreate: tagList,
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return articleMapper(updatedArticle, id);
};

export const deleteArticle = async (slug: string, id: number) => {
  const existingArticle = await await prisma.article.findFirst({
    where: {
      slug,
    },
    select: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!existingArticle) {
    throw new HttpException(404, {});
  }

  if (existingArticle.author.id !== id) {
    throw new HttpException(403, {
      message: 'You are not authorized to delete this article',
    });
  }
  await prisma.article.delete({
    where: {
      slug,
    },
  });
};

export const getCommentsByArticle = async (slug: string, id?: number) => {
  const queries = [];

  queries.push({
    author: {
      demo: true,
    },
  });

  if (id) {
    queries.push({
      author: {
        id,
      },
    });
  }

  const comments = await prisma.article.findUnique({
    where: {
      slug,
    },
    include: {
      comments: {
        where: {
          OR: queries,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          body: true,
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: true,
            },
          },
        },
      },
    },
  });

  const result = comments?.comments.map((comment: any) => ({
    ...comment,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: comment.author.followedBy.some((follow: any) => follow.id === id),
    },
  }));

  return result;
};

export const addComment = async (body: string, slug: string, id: number) => {
  if (!body) {
    throw new HttpException(422, { errors: { body: ["can't be blank"] } });
  }

  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  const comment = await prisma.comment.create({
    data: {
      body,
      article: {
        connect: {
          id: article?.id,
        },
      },
      author: {
        connect: {
          id: id,
        },
      },
    },
    include: {
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
    },
  });

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: comment.author.followedBy.some((follow: any) => follow.id === id),
    },
  };
};

export const deleteComment = async (id: number, userId: number) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id,
      author: {
        id: userId,
      },
    },
    select: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!comment) {
    throw new HttpException(404, {});
  }

  if (comment.author.id !== userId) {
    throw new HttpException(403, {
      message: 'You are not authorized to delete this comment',
    });
  }

  await prisma.comment.delete({
    where: {
      id,
    },
  });
};

export const favoriteArticle = async (slugPayload: string, id: number) => {
  const { _count, ...article } = await prisma.article.update({
    where: {
      slug: slugPayload,
    },
    data: {
      favoritedBy: {
        connect: {
          id: id,
        },
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  const result = {
    ...article,
    author: profileMapper(article.author, id),
    tagList: article?.tagList.map((tag: Tag) => tag.name),
    favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
    favoritesCount: _count?.favoritedBy,
  };

  return result;
};

export const unfavoriteArticle = async (slugPayload: string, id: number) => {
  const { _count, ...article } = await prisma.article.update({
    where: {
      slug: slugPayload,
    },
    data: {
      favoritedBy: {
        disconnect: {
          id: id,
        },
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  const result = {
    ...article,
    author: profileMapper(article.author, id),
    tagList: article?.tagList.map((tag: Tag) => tag.name),
    favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
    favoritesCount: _count?.favoritedBy,
  };

  return result;
};


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetches a single article by slug, throwing a descriptive error if missing.
 * Reuse this across bookmark and favorite services to stay DRY.
 */
async function findArticleBySlug(slug: string): Promise<Article> {
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) {
    throw Object.assign(new Error('Article not found'), { status: 404 });
  }
  return article;
}

/**
 * Shapes a raw Prisma article record into the API response object.
 * Mirrors your existing article serialisation logic — adapt field names
 * to match whatever your current formatArticle() helper returns.
 */
function formatArticle(
  article: ArticleWithMeta,
  currentUserId?: number,
): object {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList.map((t) => t.name),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: article.isFavorited,
    favoritesCount: article._count.favoritedBy,
    bookmarked: article.isBookmarked,     // ← new field exposed to clients
    author: {
      username: article.author.username,
      image: article.author.image,
      bio: article.author.bio,
    },
  };
}

// ---------------------------------------------------------------------------
// Service: bookmarkArticle
// ---------------------------------------------------------------------------

/**
 * Adds the article to the authenticated user's bookmarks.
 * Idempotent — bookmarking an already-bookmarked article is a no-op.
 *
 * @param slug         - The article's unique slug
 * @param currentUserId - The ID of the requesting user (from JWT payload)
 * @returns The formatted article, with `bookmarked: true`
 */
export async function bookmarkArticle(
  slug: string,
  currentUserId: number,
): Promise<object> {
  const article = await findArticleBySlug(slug);

  const updatedUser = await prisma.user.update({
    where: { id: currentUserId },
    data: {
      bookmarks: {
        connect: { id: article.id },
      },
    },
    select: {
      bookmarks: { select: { id: true } },
    },
  });

  // Fetch the full shaped article after the mutation
  return getFormattedArticle(article.id, currentUserId);
}

// ---------------------------------------------------------------------------
// Service: unbookmarkArticle
// ---------------------------------------------------------------------------

/**
 * Removes the article from the authenticated user's bookmarks.
 * Idempotent — unbookmarking an article that was never bookmarked is a no-op.
 *
 * @param slug          - The article's unique slug
 * @param currentUserId - The ID of the requesting user (from JWT payload)
 * @returns The formatted article, with `bookmarked: false`
 */
export async function unbookmarkArticle(
  slug: string,
  currentUserId: number,
): Promise<object> {
  const article = await findArticleBySlug(slug);

  await prisma.user.update({
    where: { id: currentUserId },
    data: {
      bookmarks: {
        disconnect: { id: article.id },
      },
    },
  });

  return getFormattedArticle(article.id, currentUserId);
}

// ---------------------------------------------------------------------------
// Service: getBookmarkedArticles
// ---------------------------------------------------------------------------

/**
 * Returns a paginated list of articles bookmarked by the authenticated user,
 * ordered by most-recently-created first.
 *
 * @param currentUserId - The ID of the requesting user
 * @param limit         - Page size (default 20, matches your existing feed API)
 * @param offset        - Pagination offset (default 0)
 * @returns `{ articles, articlesCount }` matching your existing list shape
 */
export async function getBookmarkedArticles(
  currentUserId: number,
  limit = 20,
  offset = 0,
): Promise<{ articles: object[]; articlesCount: number }> {
  // Run the count and data fetch in parallel — same pattern as your article feed
  const [articlesCount, user] = await Promise.all([
    prisma.article.count({
      where: {
        bookmarkedBy: { some: { id: currentUserId } },
      },
    }),
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        bookmarks: {
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            body: true,
            createdAt: true,
            updatedAt: true,
            authorId: true,
            tagList: { select: { name: true } },
            author: { select: { username: true, image: true, bio: true } },
            _count: { select: { favoritedBy: true } },
            favoritedBy: { where: { id: currentUserId }, select: { id: true } },
            bookmarkedBy: { where: { id: currentUserId }, select: { id: true } },
          },
        },
      },
    }),
  ]);

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const articles = user.bookmarks.map((a) =>
    formatArticle(
      {
        ...a,
        // Resolve the boolean flags from the filtered sub-arrays
        isFavorited: a.favoritedBy.length > 0,
        isBookmarked: a.bookmarkedBy.length > 0, // always true here, but consistent
      } as ArticleWithMeta,
      currentUserId,
    ),
  );

  return { articles, articlesCount };
}

// ---------------------------------------------------------------------------
// Internal helper: fetch + format a single article by ID
// ---------------------------------------------------------------------------

async function getFormattedArticle(
  articleId: number,
  currentUserId: number,
): Promise<object> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: articleId },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      tagList: { select: { name: true } },
      author: { select: { username: true, image: true, bio: true } },
      _count: { select: { favoritedBy: true } },
      favoritedBy: { where: { id: currentUserId }, select: { id: true } },
      bookmarkedBy: { where: { id: currentUserId }, select: { id: true } },
    },
  });

  return formatArticle(
    {
      ...article,
      isFavorited: article.favoritedBy.length > 0,
      isBookmarked: article.bookmarkedBy.length > 0,
    } as ArticleWithMeta,
    currentUserId,
  );
}
