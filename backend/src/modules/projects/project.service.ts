import type { Project } from '@prisma/client';
import { NotFoundError } from '../../lib/errors';
import type { ProjectRepository } from './project.repository';
import type { CreateProjectBody } from './project.schema';

export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async listProjects(userId: string): Promise<Project[]> {
    return this.projectRepository.listByUser(userId);
  }

  async createProject(userId: string, input: CreateProjectBody): Promise<Project> {
    const workspace = await this.projectRepository.findFirstWorkspaceForUser(userId);

    if (!workspace) {
      throw new NotFoundError('Workspace not found for user');
    }

    return this.projectRepository.create(workspace.id, input);
  }
}
