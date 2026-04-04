# ![Node/Express/Prisma Example App](project-logo.png)

[![Build Status](https://travis-ci.org/anishkny/node-express-realworld-example-app.svg?branch=master)](https://travis-ci.org/anishkny/node-express-realworld-example-app)

> ### Example Node (Express + Prisma) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld-example-apps) API spec.

<a href="https://thinkster.io/tutorials/node-json-api" target="_blank"><img width="454" src="https://raw.githubusercontent.com/gothinkster/realworld/master/media/learn-btn-hr.png" /></a>

## Getting Started

### Prerequisites

Run the following command to install dependencies:

```shell
npm install
```

### Environment variables

This project depends on some environment variables.
If you are running this project locally, create a `.env` file at the root for these variables.
Your host provider should included a feature to set them there directly to avoid exposing them.

Here are the required ones:

```
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
```

### Generate your Prisma client

Run the following command to generate the Prisma Client which will include types based on your database schema:

```shell
npx prisma generate
```

### Apply any SQL migration script

Run the following command to create/update your database based on existing sql migration scripts:

```shell
npx prisma migrate deploy
```

### Run the project

Run the following command to run the project:

```shell
npx nx serve api
```

### Seed the database

The project includes a seed script to populate the database:

```shell
npx prisma db seed
```

## Deploy on a remote server

Run the following command to:
- install dependencies
- apply any new migration sql scripts
- run the server

```shell
npm ci && npx prisma migrate deploy && node dist/api/main.js
```
# Task B — Feature Prompts

**Instructions:**
- Use the exact same prompt for all three tools (ChatGPT, Claude, DeepSeek)
- Start a new chat for each prompt
- Save each response
- Try to integrate each response into the project
- Document: time taken, did it work, what needed fixing

---

## Feature 1: Article Search by Keyword

```
I have an existing Node.js/Express/TypeScript project using Prisma with PostgreSQL. The project follows a service/controller pattern. Here is the existing Prisma schema for Article:

model Article {
  id          Int       @id @default(autoincrement())
  slug        String    @unique
  title       String
  description String
  body        String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now())
  tagList     Tag[]
  author      User      @relation("UserArticles", fields: [authorId], onDelete: Cascade, references: [id])
  authorId    Int
  favoritedBy User[]    @relation("UserFavorites")
  comments    Comment[]
}

Here is the existing getArticles function in article.service.ts that I want you to follow as a pattern:

export const getArticles = async (query: any, id?: number) => {
  const andQueries = buildFindAllQuery(query, id);
  const articlesCount = await prisma.article.count({ where: { AND: andQueries } });
  const articles = await prisma.article.findMany({
    where: { AND: andQueries },
    orderBy: { createdAt: 'desc' },
    skip: Number(query.offset) || 0,
    take: Number(query.limit) || 10,
    include: {
      tagList: { select: { name: true } },
      author: { select: { username: true, bio: true, image: true, followedBy: true } },
      favoritedBy: true,
      _count: { select: { favoritedBy: true } },
    },
  });
  return { articles: articles.map((article: any) => articleMapper(article, id)), articlesCount };
};

Add a search feature that allows searching articles by keyword in the title or body. Add a new query parameter called "search" to the existing getArticles function in article.service.ts. If the search parameter is provided, filter articles where the title OR body contains the search term (case-insensitive). Do not create new files — only modify the existing buildFindAllQuery function. Show me only the changes needed.
```

---

## Feature 2: Bookmark/Save Articles

```
I have an existing Node.js/Express/TypeScript project using Prisma with PostgreSQL. Here is the current Prisma schema:

model Article {
  id          Int       @id @default(autoincrement())
  slug        String    @unique
  title       String
  description String
  body        String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now())
  tagList     Tag[]
  author      User      @relation("UserArticles", fields: [authorId], onDelete: Cascade, references: [id])
  authorId    Int
  favoritedBy User[]    @relation("UserFavorites")
  comments    Comment[]
}

model User {
  id         Int       @id @default(autoincrement())
  email      String    @unique
  username   String    @unique
  password   String
  image      String?
  bio        String?
  articles   Article[] @relation("UserArticles")
  favorites  Article[] @relation("UserFavorites")
  followedBy User[]    @relation("UserFollows")
  following  User[]    @relation("UserFollows")
  comments   Comment[]
  demo       Boolean   @default(false)
}

The project uses a service/controller pattern with Express Router. Here is an example of an existing route in article.controller.ts:

router.post('/articles/:slug/favorite', auth.required, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const article = await favoriteArticle(req.params.slug, req.auth?.user?.id);
    res.json({ article });
  } catch (error) {
    next(error);
  }
});

Add a bookmark/save feature that allows authenticated users to save articles for later reading. This is different from the existing favorite feature. Show me: the Prisma schema changes needed, the new service functions (bookmarkArticle, unbookmarkArticle, getBookmarkedArticles), and the new route handlers. Follow the same patterns as the existing favorite functionality.
```

---

## Feature 3: User Profile Stats

```
I have an existing Node.js/Express/TypeScript project using Prisma with PostgreSQL. Here is the current Prisma schema:

model Article {
  id          Int       @id @default(autoincrement())
  slug        String    @unique
  title       String
  description String
  body        String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @default(now())
  tagList     Tag[]
  author      User      @relation("UserArticles", fields: [authorId], onDelete: Cascade, references: [id])
  authorId    Int
  favoritedBy User[]    @relation("UserFavorites")
  comments    Comment[]
}

model User {
  id         Int       @id @default(autoincrement())
  email      String    @unique
  username   String    @unique
  password   String
  image      String?
  bio        String?
  articles   Article[] @relation("UserArticles")
  favorites  Article[] @relation("UserFavorites")
  followedBy User[]    @relation("UserFollows")
  following  User[]    @relation("UserFollows")
  comments   Comment[]
  demo       Boolean   @default(false)
}

Here is the existing profile controller pattern:

router.get('/profiles/:username', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await getProfile(req.params.username, req.auth?.user?.id);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

Add a user profile stats endpoint at GET /profiles/:username/stats that returns: total number of articles published, total number of favourites received across all articles, total number of followers, and total number of comments written. Follow the same service/controller pattern. Show me the service function and the route handler.
```