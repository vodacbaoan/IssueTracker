import { NotFoundError } from '../../lib/errors';
import type {
  CreateCommentBody,
  CreateIssueBody,
  UpdateIssueLabelsBody,
} from './issue.schema';
import type { IssueRecord, IssueRepository } from './issue.repository';
import type { IssueStatus } from '@prisma/client';

export class IssueService {
  constructor(private readonly issueRepository: IssueRepository) {}

  private static haveSameLabelIds(currentLabelIds: string[], nextLabelIds: string[]): boolean {
    if (currentLabelIds.length !== nextLabelIds.length) {
      return false;
    }

    const currentLabelIdSet = new Set(currentLabelIds);
    return nextLabelIds.every((labelId) => currentLabelIdSet.has(labelId));
  }

  private async ensureProjectExists(projectId: string): Promise<void> {
    const project = await this.issueRepository.findProject(projectId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }
  }

  private async ensureUserExists(userId: string, errorMessage: string): Promise<void> {
    const user = await this.issueRepository.findUser(userId);

    if (!user) {
      throw new NotFoundError(errorMessage);
    }
  }

  private async ensureLabelsExist(labelIds: string[]): Promise<void> {
    if (labelIds.length === 0) {
      return;
    }

    const labels = await this.issueRepository.findLabels(labelIds);

    if (labels.length !== labelIds.length) {
      throw new NotFoundError('One or more labels not found');
    }
  }

  async listIssues(projectId: string): Promise<IssueRecord[]> {
    await this.ensureProjectExists(projectId);
    return this.issueRepository.listByProject(projectId);
  }

  async createIssue(projectId: string, input: CreateIssueBody): Promise<IssueRecord> {
    await this.ensureProjectExists(projectId);

    if (input.assigneeId) {
      await this.ensureUserExists(input.assigneeId, 'Assignee not found');
    }

    await this.ensureLabelsExist(input.labelIds);

    return this.issueRepository.create(projectId, input);
  }

  async updateIssueStatus(
    projectId: string,
    issueId: string,
    status: IssueStatus,
  ): Promise<IssueRecord> {
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

  async updateIssueAssignee(
    projectId: string,
    issueId: string,
    assigneeId: string | null,
  ): Promise<IssueRecord> {
    await this.ensureProjectExists(projectId);

    const issue = await this.issueRepository.findByProjectAndId(projectId, issueId);

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    if (assigneeId) {
      await this.ensureUserExists(assigneeId, 'Assignee not found');
    }

    if (issue.assigneeId === assigneeId) {
      return issue;
    }

    return this.issueRepository.updateAssignee(issueId, assigneeId);
  }

  async updateIssueLabels(
    projectId: string,
    issueId: string,
    input: UpdateIssueLabelsBody,
  ): Promise<IssueRecord> {
    await this.ensureProjectExists(projectId);

    const issue = await this.issueRepository.findByProjectAndId(projectId, issueId);

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    await this.ensureLabelsExist(input.labelIds);

    if (
      IssueService.haveSameLabelIds(
        issue.labels.map((label) => label.id),
        input.labelIds,
      )
    ) {
      return issue;
    }

    return this.issueRepository.updateLabels(issueId, input.labelIds);
  }

  async createComment(
    projectId: string,
    issueId: string,
    input: CreateCommentBody,
  ): Promise<IssueRecord> {
    await this.ensureProjectExists(projectId);

    const issue = await this.issueRepository.findByProjectAndId(projectId, issueId);

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    await this.ensureUserExists(input.authorId, 'Comment author not found');

    return this.issueRepository.createComment(issueId, input);
  }
}
