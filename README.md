# Issue Tracker

Full-stack issue tracker with a Next.js frontend, Express API, Prisma, and PostgreSQL.

## Run With Docker Compose

```bash
docker-compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3000/api/v1/health`

Stop:

```bash
docker-compose down
```

Seed demo data:

```bash
docker-compose run --rm backend npm run prisma:seed
```

Seeded users use password `Password123!`.

## Project Layout

```text
backend/     Express API, Prisma schema, migrations
frontend/    Next.js app
docker-compose.yml
```

## Manual Development

Start only PostgreSQL:

```bash
docker-compose up -d postgres
```

Backend:

```bash
npm --prefix backend install
npm --prefix backend run prisma:migrate
npm --prefix backend run dev
```

Frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

## Build

```bash
npm --prefix backend run build
npm --prefix frontend run build
```

## Main API Routes

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:projectId/issues`
- `POST /api/v1/projects/:projectId/issues`
- `PATCH /api/v1/projects/:projectId/issues/:issueId/status`
- `PATCH /api/v1/projects/:projectId/issues/:issueId/assignee`
- `PATCH /api/v1/projects/:projectId/issues/:issueId/labels`
- `POST /api/v1/projects/:projectId/issues/:issueId/comments`
