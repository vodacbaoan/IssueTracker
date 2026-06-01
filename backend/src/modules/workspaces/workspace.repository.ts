import type { Prisma, PrismaClient, WorkspaceRole } from '@prisma/client';
import type { CreateWorkspaceBody } from './workspace.schema';
import { publicUserSelect, type PublicUser } from '../users/user.types';

const workspaceMemberInclude = {
  user: {
    select: publicUserSelect,
  },
} satisfies Prisma.MembershipInclude;

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: Date;
  role: WorkspaceRole;
}

export type WorkspaceMemberRecord = Prisma.MembershipGetPayload<{
  include: typeof workspaceMemberInclude;
}>;

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

  findUserByEmail(email: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  }

  findMembership(
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

  listMembers(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
    return this.prisma.membership.findMany({
      where: { workspaceId },
      include: workspaceMemberInclude,
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  addMember(
    workspaceId: string,
    userId: string,
    role: Exclude<WorkspaceRole, 'owner'>,
  ): Promise<WorkspaceMemberRecord> {
    return this.prisma.membership.create({
      data: {
        workspaceId,
        userId,
        role,
      },
      include: workspaceMemberInclude,
    });
  }
}
