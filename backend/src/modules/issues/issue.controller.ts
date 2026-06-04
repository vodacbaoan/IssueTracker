import type { NextFunction, Request, Response } from 'express';
import type {
  CreateCommentBody,
  CreateIssueBody,
  UpdateIssueAssigneeBody,
  UpdateIssueLabelsBody,
  UpdateIssueStatusBody,
} from './issue.schema';
import { UnauthorizedError } from '../../lib/errors';
import type { IssueService } from './issue.service';

export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  private getAuthenticatedUserId(request: { auth?: { userId: string } }): string {
    const userId = request.auth?.userId;

    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    return userId;
  }

  list = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = this.getAuthenticatedUserId(request);
      const issues = await this.issueService.listIssues(projectId, userId);
      response.json(issues);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    request: Request<unknown, unknown, CreateIssueBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId } = request.params as { projectId: string };
      const userId = this.getAuthenticatedUserId(request);
      const issue = await this.issueService.createIssue(projectId, userId, request.body);
      response.status(201).json(issue);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    request: Request<unknown, unknown, UpdateIssueStatusBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId, issueId } = request.params as { projectId: string; issueId: string };
      const userId = this.getAuthenticatedUserId(request);
      const issue = await this.issueService.updateIssueStatus(
        projectId,
        issueId,
        userId,
        request.body.status,
      );
      response.json(issue);
    } catch (error) {
      next(error);
    }
  };

  updateAssignee = async (
    request: Request<unknown, unknown, UpdateIssueAssigneeBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId, issueId } = request.params as { projectId: string; issueId: string };
      const userId = this.getAuthenticatedUserId(request);
      const issue = await this.issueService.updateIssueAssignee(
        projectId,
        issueId,
        userId,
        request.body.assigneeId,
      );
      response.json(issue);
    } catch (error) {
      next(error);
    }
  };

  updateLabels = async (
    request: Request<unknown, unknown, UpdateIssueLabelsBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId, issueId } = request.params as { projectId: string; issueId: string };
      const userId = this.getAuthenticatedUserId(request);
      const issue = await this.issueService.updateIssueLabels(
        projectId,
        issueId,
        userId,
        request.body,
      );
      response.json(issue);
    } catch (error) {
      next(error);
    }
  };

  createComment = async (
    request: Request<unknown, unknown, CreateCommentBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId, issueId } = request.params as { projectId: string; issueId: string };
      const userId = this.getAuthenticatedUserId(request);
      const issue = await this.issueService.createComment(projectId, issueId, userId, request.body);
      response.status(201).json(issue);
    } catch (error) {
      next(error);
    }
  };
}
