import type { NextFunction, Request, Response } from 'express';
import type {
  CreateIssueBody,
  UpdateIssueAssigneeBody,
  UpdateIssueStatusBody,
} from './issue.schema';
import type { IssueService } from './issue.service';

export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  list = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { projectId } = request.params as { projectId: string };
      const issues = await this.issueService.listIssues(projectId);
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
      const issue = await this.issueService.createIssue(projectId, request.body);
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
      const issue = await this.issueService.updateIssueStatus(
        projectId,
        issueId,
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
      const issue = await this.issueService.updateIssueAssignee(
        projectId,
        issueId,
        request.body.assigneeId,
      );
      response.json(issue);
    } catch (error) {
      next(error);
    }
  };
}
