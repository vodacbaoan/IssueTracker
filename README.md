# Issue Tracker Full-Stack Starter

A beginner-friendly full-stack starter that keeps the backend layered and uses Express on the server side with Next.js on the frontend.

## Stack

### Backend
- Node.js 22
- TypeScript
- Express
- Prisma ORM
- PostgreSQL

### Frontend
- Next.js
- React
- TypeScript

## Project Structure

```text
.
|-- frontend
|   |-- src
|   |   |-- api
|   |   `-- app
|-- prisma
`-- src
    |-- config
    |-- db
    |-- lib
    |-- modules
    |   |-- auth
    |   |-- health
    |   |-- issues
    |   |-- labels
    |   |-- projects
    |   `-- users
    |-- plugins
    |-- app.ts
    `-- server.ts
```

## Backend Request Flow

Requests move through the backend in this order:

`route -> controller -> service -> repository -> database`

- `route`: defines endpoints and validates input
- `controller`: receives the HTTP request and calls the service
- `service`: contains app logic for the feature
- `repository`: talks to Prisma
- `database`: PostgreSQL stores the data

## API

- `GET /api/v1/health`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/labels`
- `GET /api/v1/users`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:projectId/issues`
- `POST /api/v1/projects/:projectId/issues`
- `POST /api/v1/projects/:projectId/issues/:issueId/comments`
- `PATCH /api/v1/projects/:projectId/issues/:issueId/assignee`
- `PATCH /api/v1/projects/:projectId/issues/:issueId/labels`
- `PATCH /api/v1/projects/:projectId/issues/:issueId/status`

### Create project body

```json
{
  "name": "CRM Dashboard",
  "description": "Initial dashboard for account managers."
}
```

### Signup body

```json
{
  "name": "Mia Chen",
  "email": "mia.chen@example.com",
  "password": "Password123!"
}
```

### Login body

```json
{
  "email": "mia.chen@example.com",
  "password": "Password123!"
}
```

### Create issue body

```json
{
  "title": "Fix login bug",
  "description": "Users hit a blank screen after submitting valid credentials on Safari.",
  "priority": "high",
  "assigneeId": "0f463f59-9ac7-47ca-a34b-b22b43ea79d2",
  "labelIds": [
    "60d7758b-5b08-46db-96a2-a17c6bccdd92",
    "390a5b34-2dd3-4e6a-8ee8-3c279b2180f2"
  ]
}
```

### Update issue assignee body

```json
{
  "assigneeId": "0f463f59-9ac7-47ca-a34b-b22b43ea79d2"
}
```

### Create issue comment body

```json
{
  "body": "I reproduced this in Safari 18 and the blank screen starts right after the redirect."
}
```

### Update issue labels body

```json
{
  "labelIds": [
    "60d7758b-5b08-46db-96a2-a17c6bccdd92",
    "390a5b34-2dd3-4e6a-8ee8-3c279b2180f2"
  ]
}
```

### Update issue status body

```json
{
  "status": "in_progress"
}
```

## Environment Variables

### Backend `.env`

Use `.env.example` and set:

- `NODE_ENV`
- `HOST`
- `PORT`
- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL_MINUTES`
- `REFRESH_TOKEN_TTL_DAYS`

### Frontend `frontend/.env`

Use `frontend/.env.example` and set:

- `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`

## Local Development

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Run migrations

```bash
npm run prisma:migrate
```

### 5. Seed sample users, labels, projects, and issue comments

```bash
npm run prisma:seed
```

Seeded demo users all use the password `Password123!`.

### 6. Start the backend

```bash
npm run dev
```

The backend runs on `http://localhost:3000`.

### 7. Install frontend dependencies

```bash
npm run frontend:install
```

### 8. Start the frontend

```bash
npm run frontend:dev
```

The frontend runs on `http://localhost:5173`.

The dashboard lets you:

- sign up and log in with real accounts
- create projects
- select one project at a time
- create issues for the selected project
- add issue descriptions for richer context
- leave comments on issues as the currently signed-in user
- rely on HttpOnly cookie auth for all write actions
- set issue priority as `low`, `medium`, or `high`
- assign issues to seeded users or leave them unassigned
- tag issues with seeded labels
- retag existing issues from the workspace
- filter issues by search text, status, priority, assignee, and label
- move issues between `todo`, `in_progress`, and `done`

## Build Commands

### Backend

```bash
npm run build
npm run start
```

### Frontend

```bash
npm run frontend:build
npm run frontend:start
```

## What This Starter Teaches

- how a Next.js frontend calls an Express backend
- how cookie-based JWT auth can protect write actions without turning the app into route-heavy SSR
- how Prisma connects backend code to PostgreSQL
- how one feature is split into route, controller, service, and repository
- how to keep the project simple without losing structure
- how projects and issues work together in a small issue-tracker workflow
- how labels and filters make a simple issue tracker easier to triage
- how issue comments add context and lightweight collaboration to a shared board
