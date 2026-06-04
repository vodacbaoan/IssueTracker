import { apiFetch, readJson } from './client';
import type { WorkspaceRole } from './workspaces';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface WorkspaceProjectGroup {
  id: string;
  name: string;
  createdAt: string;
  role: WorkspaceRole;
  projects: Project[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export async function getProjectGroups(): Promise<WorkspaceProjectGroup[]> {
  const response = await apiFetch('/projects', {}, { retryOnUnauthorized: true });
  return readJson<WorkspaceProjectGroup[]>(response);
}

export async function createProject(
  workspaceId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const response = await apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/projects`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    { retryOnUnauthorized: true },
  );

  return readJson<Project>(response);
}
