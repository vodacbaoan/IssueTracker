import type { PrismaClient, Project } from '@prisma/client';
import type { CreateProjectBody } from './project.schema';

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listByUser(userId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        workspace: {
          memberships: {
            some: { userId },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findFirstWorkspaceForUser(userId: string): Promise<{ id: string } | null> {
    return this.prisma.workspace.findFirst({
      where: {
        memberships: {
          some: { userId },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
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
