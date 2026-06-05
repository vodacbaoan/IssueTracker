import type { IssuePriority, IssueStatus, Label } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import type {
  IssueRecord,
  IssueRepository,
  ProjectMembershipRecord,
} from './issue.repository';
import { IssueService } from './issue.service';

type MockIssueRepository = Pick<
  IssueRepository,
  | 'findProjectMembership'
  | 'findLabels'
  | 'listByProject'
  | 'create'
  | 'findByProjectAndId'
  | 'updateStatus'
  | 'updateAssignee'
  | 'updateLabels'
  | 'createComment'
>;

const createIssueRepository = () =>
  ({
    findProjectMembership: vi.fn(),
    findLabels: vi.fn(),
    listByProject: vi.fn(),
    create: vi.fn(),
    findByProjectAndId: vi.fn(),
    updateStatus: vi.fn(),
    updateAssignee: vi.fn(),
    updateLabels: vi.fn(),
    createComment: vi.fn(),
  }) satisfies MockIssueRepository;

const createService = (issueRepository: MockIssueRepository) =>
  new IssueService(issueRepository as unknown as IssueRepository);

const membership = (role: ProjectMembershipRecord['role']): ProjectMembershipRecord => ({
  id: `membership-${role}`,
  role,
});

const label = (id: string): Label => ({
  id,
  name: id,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

const issueRecord = (overrides: Partial<IssueRecord> = {}) =>
  ({
    id: 'issue-1',
    projectId: 'project-1',
    assigneeId: null,
    title: 'Fix login flow',
    description: null,
    priority: 'medium' as IssuePriority,
    status: 'todo' as IssueStatus,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    labels: [],
    comments: [],
    ...overrides,
  }) as IssueRecord;

describe('IssueService', () => {
  it('throws NotFoundError when listing issues outside an accessible project', async () => {
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(null);
    const service = createService(issueRepository);

    await expect(service.listIssues('project-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(issueRepository.listByProject).not.toHaveBeenCalled();
  });

  it('lists issues for a project member', async () => {
    const issues: IssueRecord[] = [];
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('viewer'));
    issueRepository.listByProject.mockResolvedValue(issues);
    const service = createService(issueRepository);

    const result = await service.listIssues('project-1', 'user-1');

    expect(result).toBe(issues);
    expect(issueRepository.listByProject).toHaveBeenCalledWith('project-1');
  });

  it('throws ForbiddenError when a viewer creates an issue', async () => {
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('viewer'));
    const service = createService(issueRepository);

    await expect(
      service.createIssue('project-1', 'user-1', {
        title: 'Fix login flow',
        description: undefined,
        priority: 'medium',
        assigneeId: null,
        labelIds: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(issueRepository.create).not.toHaveBeenCalled();
  });

  it('creates an issue after checking assignee membership and labels', async () => {
    const input = {
      title: 'Fix login flow',
      description: undefined,
      priority: 'high' as IssuePriority,
      assigneeId: 'assignee-1',
      labelIds: ['label-1', 'label-2'],
    };
    const issue = issueRecord({ priority: 'high', assigneeId: input.assigneeId });
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('member'));
    issueRepository.findLabels.mockResolvedValue([label('label-1'), label('label-2')]);
    issueRepository.create.mockResolvedValue(issue);
    const service = createService(issueRepository);

    const result = await service.createIssue('project-1', 'user-1', input);

    expect(result).toBe(issue);
    expect(issueRepository.findProjectMembership).toHaveBeenCalledWith('project-1', 'user-1');
    expect(issueRepository.findProjectMembership).toHaveBeenCalledWith(
      'project-1',
      'assignee-1',
    );
    expect(issueRepository.findLabels).toHaveBeenCalledWith(input.labelIds);
    expect(issueRepository.create).toHaveBeenCalledWith('project-1', input);
  });

  it('throws NotFoundError when one or more labels do not exist', async () => {
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('member'));
    issueRepository.findLabels.mockResolvedValue([label('label-1')]);
    const service = createService(issueRepository);

    await expect(
      service.createIssue('project-1', 'user-1', {
        title: 'Fix login flow',
        description: undefined,
        priority: 'medium',
        assigneeId: null,
        labelIds: ['label-1', 'label-2'],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(issueRepository.create).not.toHaveBeenCalled();
  });

  it('returns the existing issue when status is unchanged', async () => {
    const issue = issueRecord({ status: 'done' });
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('admin'));
    issueRepository.findByProjectAndId.mockResolvedValue(issue);
    const service = createService(issueRepository);

    const result = await service.updateIssueStatus('project-1', 'issue-1', 'user-1', 'done');

    expect(result).toBe(issue);
    expect(issueRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('updates an issue assignee after checking the assignee membership', async () => {
    const issue = issueRecord({ assigneeId: null });
    const updatedIssue = issueRecord({ assigneeId: 'assignee-1' });
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('member'));
    issueRepository.findByProjectAndId.mockResolvedValue(issue);
    issueRepository.updateAssignee.mockResolvedValue(updatedIssue);
    const service = createService(issueRepository);

    const result = await service.updateIssueAssignee(
      'project-1',
      'issue-1',
      'user-1',
      'assignee-1',
    );

    expect(result).toBe(updatedIssue);
    expect(issueRepository.findProjectMembership).toHaveBeenCalledWith(
      'project-1',
      'assignee-1',
    );
    expect(issueRepository.updateAssignee).toHaveBeenCalledWith('issue-1', 'assignee-1');
  });

  it('returns the existing issue when label ids are unchanged', async () => {
    const issue = issueRecord({ labels: [label('label-1'), label('label-2')] });
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('member'));
    issueRepository.findByProjectAndId.mockResolvedValue(issue);
    issueRepository.findLabels.mockResolvedValue([label('label-2'), label('label-1')]);
    const service = createService(issueRepository);

    const result = await service.updateIssueLabels('project-1', 'issue-1', 'user-1', {
      labelIds: ['label-2', 'label-1'],
    });

    expect(result).toBe(issue);
    expect(issueRepository.updateLabels).not.toHaveBeenCalled();
  });

  it('creates a comment using the authenticated user as author', async () => {
    const issue = issueRecord();
    const updatedIssue = issueRecord();
    const issueRepository = createIssueRepository();
    issueRepository.findProjectMembership.mockResolvedValue(membership('member'));
    issueRepository.findByProjectAndId.mockResolvedValue(issue);
    issueRepository.createComment.mockResolvedValue(updatedIssue);
    const service = createService(issueRepository);

    const result = await service.createComment('project-1', 'issue-1', 'user-1', {
      body: 'Looks good.',
    });

    expect(result).toBe(updatedIssue);
    expect(issueRepository.createComment).toHaveBeenCalledWith('issue-1', {
      body: 'Looks good.',
      authorId: 'user-1',
    });
  });
});
