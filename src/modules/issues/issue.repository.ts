import type {
  IssueStatus,
  Label,
  Prisma,
  PrismaClient,
  Project,
  User,
} from '@prisma/client';
import type { CreateIssueBody } from './issue.schema';

const issueInclude = {
  labels: {
    orderBy: { name: 'asc' },
  },
} satisfies Prisma.IssueInclude;

export type IssueRecord = Prisma.IssueGetPayload<{ include: typeof issueInclude }>;

export class IssueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findProject(projectId: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  findUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
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
}
