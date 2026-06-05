import { describe, expect, it, vi } from 'vitest';
import { apiFetch, readJson } from './client';
import {
  createProject,
  getProjectGroups,
  type CreateProjectInput,
  type Project,
  type WorkspaceProjectGroup,
} from './projects';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  readJson: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);
const readJsonMock = vi.mocked(readJson);

describe('projects api', () => {
  it('loads project groups with auth retry enabled', async () => {
    const response = new Response('[]');
    const groups: WorkspaceProjectGroup[] = [];
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue(groups);

    const result = await getProjectGroups();

    expect(result).toBe(groups);
    expect(apiFetchMock).toHaveBeenCalledWith('/projects', {}, { retryOnUnauthorized: true });
    expect(readJsonMock).toHaveBeenCalledWith(response);
  });

  it('creates a project in an encoded workspace path', async () => {
    const response = new Response('{}');
    const project: Project = {
      id: 'project-1',
      workspaceId: 'workspace/with spaces',
      name: 'Roadmap',
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const input: CreateProjectInput = {
      name: 'Roadmap',
      description: 'Plan the next release',
    };
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue(project);

    const result = await createProject('workspace/with spaces', input);

    expect(result).toBe(project);
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/workspaces/workspace%2Fwith%20spaces/projects',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
      { retryOnUnauthorized: true },
    );
  });
});
