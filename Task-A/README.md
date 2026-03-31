# Development Log — Task-A

## Session Metadata

| Field        | Detail                          |
|--------------|---------------------------------|
| Date         | 2026-03-31                      |
| Model        | Claude Sonnet 4.6               |
| Working Dir  | `D:/github/Thesis stuff/Methodology-3/Task-A` |
| Shell        | bash (Windows 11, Git Bash)     |

---

## Prompt Given

> Initialise a Node.js project with Express and MongoDB using Mongoose. Set up the project structure with separate folders for routes, models, controllers, and middleware. Add a basic server.js that connects to MongoDB and starts the Express server on port 3000. Include a .env file for configuration.

---

## What Was Generated

All files were created by the AI directly using file-write tools. No shell commands were executed by the AI (no `npm init`, no `npm install`, no `mkdir`). Folders were created implicitly as files were written into them.

### Files Created (in order)

| # | File | Purpose |
|---|------|---------|
| 1 | `package.json` | Project manifest, scripts, dependency declarations |
| 2 | `.env` | Local environment config (gitignored) |
| 3 | `.env.example` | Committed template for `.env` |
| 4 | `.gitignore` | Excludes `node_modules/` and `.env` |
| 5 | `server.js` | Entry point — connects to MongoDB, starts Express on port 3000 |
| 6 | `models/User.js` | Mongoose schema with `name`, `email`, `timestamps` |
| 7 | `controllers/userController.js` | CRUD handlers: getAllUsers, getUserById, createUser, updateUser, deleteUser |
| 8 | `routes/userRoutes.js` | REST routes for `/api/users` mapped to controller |
| 9 | `middleware/errorHandler.js` | Centralised error handler covering validation, duplicate key, and generic errors |

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
│   └── userController.js
├── middleware/
│   └── errorHandler.js
├── models/
│   └── User.js
├── routes/
│   └── userRoutes.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

---

## Packages Declared

### dependencies

| Package   | Version  | Role                              |
|-----------|----------|-----------------------------------|
| `express` | ^4.19.2  | HTTP server and routing framework |
| `mongoose`| ^8.4.0   | MongoDB ODM                       |
| `dotenv`  | ^16.4.5  | Loads `.env` into `process.env`   |

### devDependencies

| Package    | Version | Role                        |
|------------|---------|-----------------------------|
| `nodemon`  | ^3.1.4  | Auto-restart on file changes |

> `node_modules/` does **not** exist yet — `npm install` was not run by the AI. See manual steps below.

---

## API Surface

Base path: `http://localhost:3000/api/users`

| Method | Path           | Controller fn   | Description       |
|--------|----------------|-----------------|-------------------|
| GET    | `/`            | getAllUsers      | Return all users  |
| GET    | `/:id`         | getUserById     | Return one user   |
| POST   | `/`            | createUser      | Create a user     |
| PUT    | `/:id`         | updateUser      | Replace a user    |
| DELETE | `/:id`         | deleteUser      | Delete a user     |

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

The AI did not track wall-clock time. All 9 files were written in a single uninterrupted sequence of tool calls with no user intervention between writes. No iteration or correction was needed.

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

## Notes

- `node_modules/` and `.env` are gitignored. Use `.env.example` as the reference when sharing the project.
- The `User` model is a minimal placeholder. Extend `models/User.js` with additional fields as needed.
- No authentication, no request validation middleware, and no test suite were included — the prompt did not ask for them.
