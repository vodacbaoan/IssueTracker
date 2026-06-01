import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../lib/errors';
import type { ProjectService } from './project.service';
import type { CreateProjectBody } from './project.schema';

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

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

      const projects = await this.projectService.listProjects(userId);
      response.json(projects);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    request: Request<unknown, unknown, CreateProjectBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { workspaceId } = request.params as { workspaceId: string };
      const userId = request.auth?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const project = await this.projectService.createProject(userId, workspaceId, request.body);
      response.status(201).json(project);
    } catch (error) {
      next(error);
    }
  };
}
