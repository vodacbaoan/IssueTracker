import type { PrismaClient } from '@prisma/client';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { BadRequestError } from '../../lib/errors';
import { IssueController } from './issue.controller';
import { IssueRepository } from './issue.repository';
import {
  createIssueBodySchema,
  updateIssueStatusBodySchema,
} from './issue.schema';
import { IssueService } from './issue.service';

export function createIssueRouter(prisma: PrismaClient): Router {
  const router = Router({ mergeParams: true });
  const issueRepository = new IssueRepository(prisma);
  const issueService = new IssueService(issueRepository);
  const issueController = new IssueController(issueService);

  const validateCreateIssue = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = createIssueBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  const validateUpdateStatus = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = updateIssueStatusBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  router.get('/', issueController.list);
  router.post('/', validateCreateIssue, issueController.create);
  router.patch('/:issueId/status', validateUpdateStatus, issueController.updateStatus);

  return router;
}
