import { describe, expect, it, vi } from 'vitest';
import { apiFetch, readJson } from './client';
import { getIssues, updateIssueStatus, type Issue } from './issues';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  readJson: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);
const readJsonMock = vi.mocked(readJson);

describe('issues api', () => {
  it('loads issues for an encoded project path', async () => {
    const response = new Response('[]');
    const issues: Issue[] = [];
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue(issues);

    const result = await getIssues('project/one');

    expect(result).toBe(issues);
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/projects/project%2Fone/issues',
      {},
      { retryOnUnauthorized: true },
    );
    expect(readJsonMock).toHaveBeenCalledWith(response);
  });

  it('updates issue status with a PATCH request', async () => {
    const response = new Response('{}');
    const issue: Issue = {
      id: 'issue-1',
      projectId: 'project-1',
      assigneeId: null,
      labels: [],
      comments: [],
      title: 'Fix login flow',
      description: null,
      priority: 'medium',
      status: 'done',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue(issue);

    const result = await updateIssueStatus('project-1', 'issue-1', 'done');

    expect(result).toBe(issue);
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/projects/project-1/issues/issue-1/status',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'done' }),
      },
      { retryOnUnauthorized: true },
    );
  });
});
