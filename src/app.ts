import cors from 'cors';
import type { PrismaClient } from '@prisma/client';
import express, { type Express } from 'express';
import { type AppConfig, loadConfig } from './config/env';
import { createPrismaClient } from './db/prisma';
import { createHealthRouter } from './modules/health/health.route';
import { createAuthContextMiddleware, requireAuth } from './modules/auth/auth.middleware';
import { createAuthRouter } from './modules/auth/auth.route';
import { createIssueRouter } from './modules/issues/issue.route';
import { createLabelRouter } from './modules/labels/label.route';
import { createProjectRouter } from './modules/projects/project.route';
import { createUserRouter } from './modules/users/user.route';
import errorHandler, { notFoundHandler } from './plugins/error-handler';

export interface BuildAppOptions {
  config?: AppConfig;
  prisma?: PrismaClient;
}

export interface BuiltApp {
  app: Express;
  close: () => Promise<void>;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<BuiltApp> {
  const config = options.config ?? loadConfig();
  const prisma = options.prisma ?? createPrismaClient(config.DATABASE_URL);
  const ownsPrisma = options.prisma === undefined;

  const app = express();

  app.use(
    cors({
      origin: config.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(createAuthContextMiddleware(config));

  app.use('/api/v1', createHealthRouter(config));
  app.use('/api/v1/auth', createAuthRouter(prisma, config));
  app.use('/api/v1/labels', createLabelRouter(prisma));
  app.use('/api/v1/users', createUserRouter(prisma));
  app.use('/api/v1/projects/:projectId/issues', createIssueRouter(prisma, requireAuth));
  app.use('/api/v1/projects', createProjectRouter(prisma, requireAuth));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return {
    app,
    close: async () => {
      if (ownsPrisma) {
        await prisma.$disconnect();
      }
    },
  };
}
