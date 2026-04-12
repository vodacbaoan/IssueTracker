import type { Issue, IssueStatus, PrismaClient, Project, User } from '@prisma/client';
import type { CreateIssueBody } from './issue.schema';

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

  listByProject(projectId: string): Promise<Issue[]> {
    return this.prisma.issue.findMany({
      where: { projectId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  create(projectId: string, input: CreateIssueBody): Promise<Issue> {
    return this.prisma.issue.create({
      data: {
        projectId,
        title: input.title,
        priority: input.priority,
        assigneeId: input.assigneeId,
      },
    });
  }

  findByProjectAndId(projectId: string, issueId: string): Promise<Issue | null> {
    return this.prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
    });
  }

  updateStatus(issueId: string, status: IssueStatus): Promise<Issue> {
    return this.prisma.issue.update({
      where: { id: issueId },
      data: { status },
    });
  }

  updateAssignee(issueId: string, assigneeId: string | null): Promise<Issue> {
    return this.prisma.issue.update({
      where: { id: issueId },
      data: { assigneeId },
    });
  }
}
