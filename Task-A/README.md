# Development Log — Task-A

## Session Metadata

| Field        | Detail                          |
|--------------|---------------------------------|
| Date         | 2026-03-31                      |
| Model        | Claude Sonnet 4.6               |
| Working Dir  | `D:/github/Thesis stuff/Methodology-3/Task-A` |
| Shell        | bash (Windows 11, Git Bash)     |

---

## Prompts Given

Prompt #1:
> Initialise a Node.js project with Express and MongoDB using Mongoose. Set up the project structure with separate folders for routes, models, controllers, and middleware. Add a basic server.js that connects to MongoDB and starts the Express server on port 3000. Include a .env file for configuration.

Prompt #2:
> Review everything you did in this session — all files created, folders, packages installed, commands run, and the project structure. Create a README.md that documents: the prompt I gave you, what you generated, the full file/folder structure, all packages used, the time it took, and any manual steps needed. Format it as a development log, not a user guide.

Prompt #3:
> Add JWT-based authentication to the project. Create a User model with email and password fields, add password hashing with bcrypt on registration. Create auth routes for POST /api/auth/register and POST /api/auth/login that return a JWT token. Add an auth middleware that protects routes by verifying the Bearer token. Update the existing user routes to be protected. Add jsonwebtoken and bcryptjs as dependencies.

Prompt #4:
> Add a Blog Post feature. Create a Post model with title, content, author (reference to User), tags (array of strings), and timestamps. Create a post controller and routes at /api/posts with full CRUD — create, get all, get by id, update, and delete. Only authenticated users can create, update, or delete posts. A user can only update or delete their own posts. The get all endpoint should support filtering by tag via query parameter. Populate the author field with the user's name and email when returning posts.


Prompt #5:
> Add a Comment feature. Create a Comment model with content, author (reference to User), post (reference to Post), and timestamps. Create comment routes nested under posts at /api/posts/:postId/comments. Only authenticated users can create and delete comments. A user can only delete their own comments. Populate the author field with name and email when returning comments.


Prompt #6:
> The README.md already has all 5 prompts listed. Now update the rest of the file to reflect the current state of the project. Update: the Files Created table to include all new files from prompts 3-5 (auth controller, auth routes, auth middleware, Post model, post controller, post routes, Comment model, comment controller, comment routes). Update the Full Project Structure tree. Update the Packages Declared table to include jsonwebtoken and bcryptjs. Update the API Surface table to include all auth, post, and comment endpoints. Remove the Notes section that says "No authentication" since authentication now exists. Keep the same format.

---

## What Was Generated

All files were created by the AI directly using file-write tools. No shell commands were executed by the AI (no `npm init`, no `npm install`, no `mkdir`). Folders were created implicitly as files were written into them.

### Files Created (in order)

| # | File | Prompt | Purpose |
|---|------|--------|---------|
| 1 | `package.json` | #1 | Project manifest, scripts, dependency declarations |
| 2 | `.env` | #1 | Local environment config (gitignored) |
| 3 | `.env.example` | #1 | Committed template for `.env` |
| 4 | `.gitignore` | #1 | Excludes `node_modules/` and `.env` |
| 5 | `server.js` | #1 | Entry point — connects to MongoDB, starts Express on port 3000 |
| 6 | `models/User.js` | #1 | Mongoose schema with `name`, `email`, `password`, `timestamps` |
| 7 | `controllers/userController.js` | #1 | CRUD handlers: getAllUsers, getUserById, createUser, updateUser, deleteUser |
| 8 | `routes/userRoutes.js` | #1 | REST routes for `/api/users`; all routes protected |
| 9 | `middleware/errorHandler.js` | #1 | Centralised error handler covering validation, duplicate key, and generic errors |
| 10 | `middleware/auth.js` | #3 | JWT Bearer token verification; attaches `req.user` |
| 11 | `controllers/authController.js` | #3 | `register` (bcrypt hash via pre-save hook) and `login` (compare + sign token) |
| 12 | `routes/authRoutes.js` | #3 | Maps POST `/register` and POST `/login` |
| 13 | `models/Post.js` | #4 | Mongoose schema with `title`, `content`, `author` (ref), `tags`, `timestamps` |
| 14 | `controllers/postController.js` | #4 | Full CRUD with ownership checks on update/delete |
| 15 | `routes/postRoutes.js` | #4 | REST routes for `/api/posts`; GET public, write ops protected |
| 16 | `models/Comment.js` | #5 | Mongoose schema with `content`, `author` (ref), `post` (ref), `timestamps` |
| 17 | `controllers/commentController.js` | #5 | getComments, createComment, deleteComment with ownership check |
| 18 | `routes/commentRoutes.js` | #5 | Nested routes under `/:postId/comments`; uses `mergeParams: true` |

### Folders Created (implicitly)

```
Task-A/
├── controllers/
├── middleware/
├── models/
└── routes/
```

---

## Full Project Structure

```
Task-A/
├── controllers/
│   ├── authController.js
│   ├── commentController.js
│   ├── postController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   ├── Comment.js
│   ├── Post.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── commentRoutes.js
│   ├── postRoutes.js
│   └── userRoutes.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── sonar-project.properties
└── server.js
```

---

## Packages Declared

### dependencies

| Package          | Version  | Role                              |
|------------------|----------|-----------------------------------|
| `bcryptjs`       | ^2.4.3   | Password hashing and comparison   |
| `dotenv`         | ^16.4.5  | Loads `.env` into `process.env`   |
| `express`        | ^4.19.2  | HTTP server and routing framework |
| `jsonwebtoken`   | ^9.0.2   | JWT signing and verification      |
| `mongoose`       | ^8.4.0   | MongoDB ODM                       |

### devDependencies

| Package    | Version | Role                        |
|------------|---------|-----------------------------|
| `nodemon`  | ^3.1.4  | Auto-restart on file changes |

> `node_modules/` does **not** exist yet — `npm install` was not run by the AI. See manual steps below.

---

## API Surface

Base URL: `http://localhost:3000`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account, returns JWT |
| POST | `/api/auth/login` | — | Validate credentials, returns JWT |

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | Bearer token | Return all users |
| GET | `/api/users/:id` | Bearer token | Return one user |
| POST | `/api/users` | Bearer token | Create a user |
| PUT | `/api/users/:id` | Bearer token | Replace a user |
| DELETE | `/api/users/:id` | Bearer token | Delete a user |

### Posts — `/api/posts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts` | — | Return all posts; optional `?tag=` filter |
| GET | `/api/posts/:id` | — | Return one post with populated author |
| POST | `/api/posts` | Bearer token | Create a post |
| PUT | `/api/posts/:id` | Bearer token | Update own post (403 if not author) |
| DELETE | `/api/posts/:id` | Bearer token | Delete own post (403 if not author) |

### Comments — `/api/posts/:postId/comments`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts/:postId/comments` | — | Return all comments on a post |
| POST | `/api/posts/:postId/comments` | Bearer token | Create a comment on a post |
| DELETE | `/api/posts/:postId/comments/:commentId` | Bearer token | Delete own comment (403 if not author) |

---

## Error Handling

Handled in `middleware/errorHandler.js`, registered as the last middleware in `server.js`:

| Condition                | HTTP Status | Response shape                          |
|--------------------------|-------------|-----------------------------------------|
| Mongoose `ValidationError` | 400       | `{ message, errors: [string] }`         |
| Duplicate key (`code 11000`) | 409     | `{ message: "Duplicate key error" }`    |
| Anything else            | 500         | `{ message }`                           |

---

## Time

| Prompt | Feature | Time |
|--------|---------|------|
| #1 | Project setup (Express, MongoDB, MVC structure) | 1m 7s |
| #2 | README documentation | 1m 32s |
| #3 | JWT authentication | 40s |
| #4 | Blog posts CRUD with tags | 36s |
| #5 | Comments on posts | 38s |
| #6 | README update | 1m 18s |
| **Total** | | **6m 11s** |

---

## Manual Steps Required

### 1. Install dependencies

```bash
cd "D:/github/Thesis stuff/Methodology-3/Task-A"
npm install
```

### 2. Configure `.env`

The default `.env` is pre-filled for a local MongoDB instance:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task-a
NODE_ENV=development
```

Change `MONGODB_URI` if needed:

- **Atlas:** `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/task-a`
- **Local with auth:** `mongodb://username:password@localhost:27017/task-a`

### 3. Start the server

```bash
npm run dev     # development (nodemon)
npm start       # production (node)
```

---

## Code Quality Analysis

### SonarQube (Code Quality, Code Smells, Bugs, Security)

**Start SonarQube via Docker:**
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
```

Wait 1-2 minutes for SonarQube to fully start, then open `http://localhost:9000`.

**First-time login:**
- Username: `admin`
- Password: `admin`
- You will be asked to change the password on first login

**Create a project:**
1. Click "Create a local project"
2. Project key: `task-a`
3. Display name: `Task A - Blog API`
4. Click "Set Up"
5. Choose "Locally"
6. Generate a token and copy it

**Create `sonar-project.properties` in the project root:**
```properties
sonar.projectKey=task-a
sonar.projectName=Task A - Blog API
sonar.sources=.
sonar.exclusions=node_modules/**
sonar.host.url=http://localhost:9000
sonar.token=YOUR_TOKEN_HERE
```

**Run:**
```bash
npm install -g sonarqube-scanner
sonar-scanner
```

**View results:** Open `http://localhost:9000` and click on the `task-a` project.

**Export results:**
```bash
curl -u admin:YOUR_PASSWORD "http://localhost:9000/api/measures/component?component=task-a&metricKeys=bugs,vulnerabilities,code_smells,duplicated_lines_density,coverage,ncloc,reliability_rating,security_rating,sqale_rating" -o sonarqube_metrics.json
curl -u admin:YOUR_PASSWORD "http://localhost:9000/api/issues/search?componentKeys=task-a&ps=500" -o sonarqube_issues.json
```

**Stop / Restart SonarQube:**
```bash
docker stop sonarqube    # stop
docker start sonarqube   # restart
docker stop sonarqube && docker rm sonarqube   # remove completely
```

### ESLint (Code Style, Best Practices)

*To be added.*

### Semgrep (Security Vulnerabilities)

*To be added.*

### Snyk (Dependency Vulnerabilities)

*To be added.*

---

## Notes

- `node_modules/` and `.env` are gitignored. Use `.env.example` as the reference when sharing the project.
- Set `JWT_SECRET` in `.env` to a long random string before any production use.