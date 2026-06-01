import type { PrismaClient } from '@prisma/client';
import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { BadRequestError } from '../../lib/errors';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceRepository } from './workspace.repository';
import { addWorkspaceMemberBodySchema, createWorkspaceBodySchema } from './workspace.schema';
import { WorkspaceService } from './workspace.service';

export function createWorkspaceRouter(prisma: PrismaClient, requireAuth: RequestHandler): Router {
  const router = Router();
  const workspaceRepository = new WorkspaceRepository(prisma);
  const workspaceService = new WorkspaceService(workspaceRepository);
  const workspaceController = new WorkspaceController(workspaceService);

  const validateCreateWorkspace = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = createWorkspaceBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  const validateAddWorkspaceMember = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = addWorkspaceMemberBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  router.get('/', requireAuth, workspaceController.list);
  router.post('/', requireAuth, validateCreateWorkspace, workspaceController.create);
  router.get('/:workspaceId/members', requireAuth, workspaceController.listMembers);
  router.post(
    '/:workspaceId/members',
    requireAuth,
    validateAddWorkspaceMember,
    workspaceController.addMember,
  );

  return router;
}
