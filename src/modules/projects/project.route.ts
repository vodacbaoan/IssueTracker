import type { PrismaClient } from '@prisma/client';
import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { BadRequestError } from '../../lib/errors';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './project.repository';
import { createProjectBodySchema } from './project.schema';
import { ProjectService } from './project.service';

export function createProjectRouter(prisma: PrismaClient, requireAuth: RequestHandler): Router {
  const router = Router();
  const projectRepository = new ProjectRepository(prisma);
  const projectService = new ProjectService(projectRepository);
  const projectController = new ProjectController(projectService);
  const validateCreateProject = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = createProjectBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  router.get('/', projectController.list);
  router.post('/', requireAuth, validateCreateProject, projectController.create);

  return router;
}
