import type { Issue, IssueStatus } from '@prisma/client';
import { NotFoundError } from '../../lib/errors';
import type { CreateIssueBody } from './issue.schema';
import type { IssueRepository } from './issue.repository';

export class IssueService {
  constructor(private readonly issueRepository: IssueRepository) {}

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.issueRepository.findProject(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }
  }

  async listIssues(projectId: string): Promise<Issue[]> {
    await this.ensureProjectExists(projectId);
    return this.issueRepository.listByProject(projectId);
  }

  async createIssue(projectId: string, input: CreateIssueBody): Promise<Issue> {
    await this.ensureProjectExists(projectId);
    return this.issueRepository.create(projectId, input);
  }

  async updateIssueStatus(projectId: string, issueId: string, status: IssueStatus): Promise<Issue> {
    await this.ensureProjectExists(projectId);

    const issue = await this.issueRepository.findByProjectAndId(projectId, issueId);

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    if (issue.status === status) {
      return issue;
    }

    return this.issueRepository.updateStatus(issueId, status);
  }
}
