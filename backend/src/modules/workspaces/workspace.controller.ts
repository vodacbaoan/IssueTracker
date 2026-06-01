import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../lib/errors';
import type { AddWorkspaceMemberBody, CreateWorkspaceBody } from './workspace.schema';
import type { WorkspaceService } from './workspace.service';

export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  list = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = request.auth?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const workspaces = await this.workspaceService.listWorkspaces(userId);
      response.json(workspaces);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    request: Request<unknown, unknown, CreateWorkspaceBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = request.auth?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const workspace = await this.workspaceService.createWorkspace(userId, request.body);
      response.status(201).json(workspace);
    } catch (error) {
      next(error);
    }
  };

  listMembers = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const userId = request.auth?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const members = await this.workspaceService.listMembers(workspaceId, userId);
      response.json(members);
    } catch (error) {
      next(error);
    }
  };

  addMember = async (
    request: Request<unknown, unknown, AddWorkspaceMemberBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const userId = request.auth?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const member = await this.workspaceService.addMember(workspaceId, userId, request.body);
      response.status(201).json(member);
    } catch (error) {
      next(error);
    }
  };
}
