import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import articleMapper from '../article/article.mapper';
import { Tag } from '../tag/tag.model';
import profileMapper from '../profile/profile.utils';

/**
 * Bookmark an article for a user
 */
export const bookmarkArticle = async (slugPayload: string, id: number) => {
    const { _count, ...article } = await prisma.article.update({
        where: {
            slug: slugPayload,
        },
        data: {
            bookmarkedBy: {
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
            favoritedBy: {
                select: {
                    id: true,
                },
            },
            bookmarkedBy: {
                select: {
                    id: true,
                },
            },
            _count: {
                select: {
                    favoritedBy: true,
                    bookmarkedBy: true,
                },
            },
        },
    });

    const result = {
        ...article,
        author: profileMapper(article.author, id),
        tagList: article?.tagList.map((tag: Tag) => tag.name),
        favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
        bookmarked: article.bookmarkedBy.some((bookmarked: any) => bookmarked.id === id),
        favoritesCount: _count?.favoritedBy,
        bookmarksCount: _count?.bookmarkedBy,
    };

    return result;
};

/**
 * Remove bookmark from an article
 */
export const unbookmarkArticle = async (slugPayload: string, id: number) => {
    const { _count, ...article } = await prisma.article.update({
        where: {
            slug: slugPayload,
        },
        data: {
            bookmarkedBy: {
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
            favoritedBy: {
                select: {
                    id: true,
                },
            },
            bookmarkedBy: {
                select: {
                    id: true,
                },
            },
            _count: {
                select: {
                    favoritedBy: true,
                    bookmarkedBy: true,
                },
            },
        },
    });

    const result = {
        ...article,
        author: profileMapper(article.author, id),
        tagList: article?.tagList.map((tag: Tag) => tag.name),
        favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
        bookmarked: article.bookmarkedBy.some((bookmarked: any) => bookmarked.id === id),
        favoritesCount: _count?.favoritedBy,
        bookmarksCount: _count?.bookmarkedBy,
    };

    return result;
};

/**
 * Get all bookmarked articles for a user with filtering
 */
export const getBookmarkedArticles = async (query: any, id?: number) => {
    const andQueries = buildFindAllQuery(query, id);

    // Add bookmarked filter
    andQueries.push({
        bookmarkedBy: {
            some: {
                id: id,
            },
        },
    });

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
            favoritedBy: {
                select: {
                    id: true,
                },
            },
            bookmarkedBy: {
                select: {
                    id: true,
                },
            },
            _count: {
                select: {
                    favoritedBy: true,
                    bookmarkedBy: true,
                },
            },
        },
    });

    return {
        articles: articles.map((article: any) => ({
            ...article,
            author: profileMapper(article.author, id),
            tagList: article?.tagList.map((tag: Tag) => tag.name),
            favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
            bookmarked: article.bookmarkedBy.some((bookmarked: any) => bookmarked.id === id),
            favoritesCount: article._count?.favoritedBy,
            bookmarksCount: article._count?.bookmarkedBy,
        })),
        articlesCount,
    };
};

/**
 * Helper function to build query for bookmarked articles
 * Reuses your existing buildFindAllQuery pattern
 */
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

/**
 * Check if user has bookmarked an article
 */
export const isArticleBookmarked = async (slug: string, id: number): Promise<boolean> => {
    const article = await prisma.article.findUnique({
        where: { slug },
        select: {
            bookmarkedBy: {
                where: { id: id },
                select: { id: true }
            }
        }
    });

    return !!(article?.bookmarkedBy?.length);
};