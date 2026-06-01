import type { Project, WorkspaceRole } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import type { ProjectRepository, WorkspaceProjectsRecord } from './project.repository';
import type { CreateProjectBody } from './project.schema';

export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  private static canCreateProjects(role: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin' || role === 'member';
  }

  async listProjects(userId: string): Promise<WorkspaceProjectsRecord[]> {
    return this.projectRepository.listByUser(userId);
  }

  async createProject(
    userId: string,
    workspaceId: string,
    input: CreateProjectBody,
  ): Promise<Project> {
    const membership = await this.projectRepository.findWorkspaceMembership(workspaceId, userId);

    if (!membership) {
      throw new NotFoundError('Workspace not found');
    }

    if (!ProjectService.canCreateProjects(membership.role)) {
      throw new ForbiddenError('You do not have permission to create projects in this workspace');
    }

    return this.projectRepository.create(workspaceId, input);
  }
}
