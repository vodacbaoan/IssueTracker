import type { PrismaClient } from '@prisma/client';
import { Router, type RequestHandler } from 'express';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

export function createProjectRouter(prisma: PrismaClient, requireAuth: RequestHandler): Router {
  const router = Router();
  const projectRepository = new ProjectRepository(prisma);
  const projectService = new ProjectService(projectRepository);
  const projectController = new ProjectController(projectService);

  router.get('/', requireAuth, projectController.list);

  return router;
}
