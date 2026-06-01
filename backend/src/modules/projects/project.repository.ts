import type { PrismaClient, Project, WorkspaceRole } from '@prisma/client';
import type { CreateProjectBody } from './project.schema';

export interface WorkspaceProjectsRecord {
  id: string;
  name: string;
  createdAt: Date;
  role: WorkspaceRole;
  projects: Project[];
}

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUser(userId: string): Promise<WorkspaceProjectsRecord[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        memberships: {
          some: { userId },
        },
        projects: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        memberships: {
          where: { userId },
          select: { role: true },
        },
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
      role: workspace.memberships[0]?.role ?? 'viewer',
      projects: workspace.projects,
    }));
  }

  findWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ): Promise<{ id: string; role: WorkspaceRole } | null> {
    return this.prisma.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });
  }

  create(workspaceId: string, input: CreateProjectBody): Promise<Project> {
    return this.prisma.project.create({
      data: {
        workspaceId,
        name: input.name,
        description: input.description,
      },
    });
  }
}
