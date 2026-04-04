import { Request, Response, NextFunction, Router } from 'express';
import auth from '../auth/auth';
import { bookmarkArticle, getBookmarkedArticles, unbookmarkArticle } from './bookmark.service';

const router = Router();

/**
 * POST /api/articles/:slug/bookmark
 * Bookmark an article
 */
router.post('/articles/:slug/bookmark', auth.required, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await bookmarkArticle(req.params.slug, req.auth?.user?.id);
        res.json({ article });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/articles/:slug/bookmark
 * Remove bookmark from an article
 */
router.delete('/articles/:slug/bookmark', auth.required, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await unbookmarkArticle(req.params.slug, req.auth?.user?.id);
        res.json({ article });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/bookmarked
 * Get user's bookmarked articles
 * Optional query parameters:
 * - limit (default: 10)
 * - offset (default: 0)
 * - author (filter by author username)
 * - tag (filter by tag)
 * - favorited (filter by favorited by username)
 */
router.get('/articles/bookmarks', auth.required, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await getBookmarkedArticles(req.query, req.auth?.user?.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;