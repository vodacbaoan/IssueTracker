import type { NextFunction, Request, Response } from 'express';
import type { ProjectService } from './project.service';
import type { CreateProjectBody } from './project.schema';

export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  list = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const projects = await this.projectService.listProjects();
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
      const project = await this.projectService.createProject(request.body);
      response.status(201).json(project);
    } catch (error) {
      next(error);
    }
  };
}
