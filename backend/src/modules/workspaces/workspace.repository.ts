import type { PrismaClient, WorkspaceRole } from '@prisma/client';
import type { CreateWorkspaceBody } from './workspace.schema';

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: Date;
  role: WorkspaceRole;
}

export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByUser(userId: string): Promise<WorkspaceRecord[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        memberships: {
          some: { userId },
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
      },
      orderBy: { createdAt: 'asc' },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
      role: workspace.memberships[0]?.role ?? 'viewer',
    }));
  }

  async createWithOwner(userId: string, input: CreateWorkspaceBody): Promise<WorkspaceRecord> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: input.name,
        memberships: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return {
      ...workspace,
      role: 'owner',
    };
  }
}
