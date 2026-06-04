import type { IssueStatus, WorkspaceRole } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import type {
  CreateCommentBody,
  CreateIssueBody,
  UpdateIssueLabelsBody,
} from './issue.schema';
import type {
  IssueRecord,
  IssueRepository,
  ProjectMembershipRecord,
} from './issue.repository';

export class IssueService {
  constructor(private readonly issueRepository: IssueRepository) {}

  private static canWriteIssues(role: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin' || role === 'member';
  }

  private static haveSameLabelIds(currentLabelIds: string[], nextLabelIds: string[]): boolean {
    if (currentLabelIds.length !== nextLabelIds.length) {
      return false;
    }

    const currentLabelIdSet = new Set(currentLabelIds);
    return nextLabelIds.every((labelId) => currentLabelIdSet.has(labelId));
  }

  private async getProjectMembership(
    projectId: string,
    userId: string,
  ): Promise<ProjectMembershipRecord> {
    const membership = await this.issueRepository.findProjectMembership(projectId, userId);

    if (!membership) {
      throw new NotFoundError('Project not found');
    }

    return membership;
  }

  private async getProjectWriteMembership(
    projectId: string,
    userId: string,
  ): Promise<ProjectMembershipRecord> {
    const membership = await this.getProjectMembership(projectId, userId);

    if (!IssueService.canWriteIssues(membership.role)) {
      throw new ForbiddenError('You do not have permission to modify issues in this workspace');
    }

    return membership;
  }

  private async ensureWorkspaceMember(
    projectId: string,
    userId: string,
    errorMessage: string,
  ): Promise<void> {
    const membership = await this.issueRepository.findProjectMembership(projectId, userId);

    if (!membership) {
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

  async listIssues(projectId: string, userId: string): Promise<IssueRecord[]> {
    await this.getProjectMembership(projectId, userId);
    return this.issueRepository.listByProject(projectId);
  }

  async createIssue(
    projectId: string,
    userId: string,
    input: CreateIssueBody,
  ): Promise<IssueRecord> {
    await this.getProjectWriteMembership(projectId, userId);

    if (input.assigneeId) {
      await this.ensureWorkspaceMember(projectId, input.assigneeId, 'Assignee not found');
    }

    await this.ensureLabelsExist(input.labelIds);

    return this.issueRepository.create(projectId, input);
  }

  async updateIssueStatus(
    projectId: string,
    issueId: string,
    userId: string,
    status: IssueStatus,
  ): Promise<IssueRecord> {
    await this.getProjectWriteMembership(projectId, userId);

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
    userId: string,
    assigneeId: string | null,
  ): Promise<IssueRecord> {
    await this.getProjectWriteMembership(projectId, userId);

    const issue = await this.issueRepository.findByProjectAndId(projectId, issueId);

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    if (assigneeId) {
      await this.ensureWorkspaceMember(projectId, assigneeId, 'Assignee not found');
    }

    if (issue.assigneeId === assigneeId) {
      return issue;
    }

    return this.issueRepository.updateAssignee(issueId, assigneeId);
  }

  async updateIssueLabels(
    projectId: string,
    issueId: string,
    userId: string,
    input: UpdateIssueLabelsBody,
  ): Promise<IssueRecord> {
    await this.getProjectWriteMembership(projectId, userId);

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
    authorId: string,
    input: CreateCommentBody,
  ): Promise<IssueRecord> {
    await this.getProjectWriteMembership(projectId, authorId);

    const issue = await this.issueRepository.findByProjectAndId(projectId, issueId);

    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    return this.issueRepository.createComment(issueId, {
      ...input,
      authorId,
    });
  }
}
