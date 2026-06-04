import type {
  IssueStatus,
  Prisma,
  PrismaClient,
  Label,
  WorkspaceRole,
} from '@prisma/client';
import type { CreateCommentBody, CreateIssueBody } from './issue.schema';
import { publicUserSelect } from '../users/user.types';

const issueInclude = {
  labels: {
    orderBy: { name: 'asc' },
  },
  comments: {
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: publicUserSelect,
      },
    },
  },
} satisfies Prisma.IssueInclude;

export type IssueRecord = Prisma.IssueGetPayload<{ include: typeof issueInclude }>;

export interface ProjectMembershipRecord {
  id: string;
  role: WorkspaceRole;
}

export class IssueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findProjectMembership(
    projectId: string,
    userId: string,
  ): Promise<ProjectMembershipRecord | null> {
    return this.prisma.membership.findFirst({
      where: {
        userId,
        workspace: {
          projects: {
            some: {
              id: projectId,
            },
          },
        },
      },
      select: {
        id: true,
        role: true,
      },
    });
  }

  findLabels(labelIds: string[]): Promise<Label[]> {
    return this.prisma.label.findMany({
      where: {
        id: {
          in: labelIds,
        },
      },
    });
  }

  listByProject(projectId: string): Promise<IssueRecord[]> {
    return this.prisma.issue.findMany({
      where: { projectId },
      include: issueInclude,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  create(projectId: string, input: CreateIssueBody): Promise<IssueRecord> {
    return this.prisma.issue.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        labels:
          input.labelIds.length > 0
            ? {
                connect: input.labelIds.map((labelId) => ({ id: labelId })),
              }
            : undefined,
      },
      include: issueInclude,
    });
  }

  findByProjectAndId(projectId: string, issueId: string): Promise<IssueRecord | null> {
    return this.prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
      include: issueInclude,
    });
  }

  updateStatus(issueId: string, status: IssueStatus): Promise<IssueRecord> {
    return this.prisma.issue.update({
      where: { id: issueId },
      data: { status },
      include: issueInclude,
    });
  }

  updateAssignee(issueId: string, assigneeId: string | null): Promise<IssueRecord> {
    return this.prisma.issue.update({
      where: { id: issueId },
      data: { assigneeId },
      include: issueInclude,
    });
  }

  updateLabels(issueId: string, labelIds: string[]): Promise<IssueRecord> {
    return this.prisma.issue.update({
      where: { id: issueId },
      data: {
        labels: {
          set: labelIds.map((labelId) => ({ id: labelId })),
        },
      },
      include: issueInclude,
    });
  }

  createComment(
    issueId: string,
    input: CreateCommentBody & { authorId: string },
  ): Promise<IssueRecord> {
    return this.prisma.issue.update({
      where: { id: issueId },
      data: {
        comments: {
          create: {
            authorId: input.authorId,
            body: input.body,
          },
        },
      },
      include: issueInclude,
    });
  }
}
