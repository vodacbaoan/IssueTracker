import type { PrismaClient } from '@prisma/client';
import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { BadRequestError } from '../../lib/errors';
import { IssueController } from './issue.controller';
import { IssueRepository } from './issue.repository';
import {
  createCommentBodySchema,
  createIssueBodySchema,
  updateIssueAssigneeBodySchema,
  updateIssueLabelsBodySchema,
  updateIssueStatusBodySchema,
} from './issue.schema';
import { IssueService } from './issue.service';

export function createIssueRouter(prisma: PrismaClient, requireAuth: RequestHandler): Router {
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

  const validateUpdateAssignee = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = updateIssueAssigneeBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  const validateUpdateLabels = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = updateIssueLabelsBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(
        new BadRequestError('Request validation failed', validationResult.error.flatten()),
      );
      return;
    }

    request.body = validationResult.data;
    next();
  };

  const validateCreateComment = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = createCommentBodySchema.safeParse(request.body);

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
  router.post('/', requireAuth, validateCreateIssue, issueController.create);
  router.post('/:issueId/comments', requireAuth, validateCreateComment, issueController.createComment);
  router.patch('/:issueId/status', requireAuth, validateUpdateStatus, issueController.updateStatus);
  router.patch('/:issueId/assignee', requireAuth, validateUpdateAssignee, issueController.updateAssignee);
  router.patch('/:issueId/labels', requireAuth, validateUpdateLabels, issueController.updateLabels);

  return router;
}
