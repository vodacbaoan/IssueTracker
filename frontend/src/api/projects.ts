import { apiFetch, readJson } from './client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export async function getProjects(): Promise<Project[]> {
  const response = await apiFetch('/projects');
  return readJson<Project[]>(response);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const response = await apiFetch('/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, { retryOnUnauthorized: true });

  return readJson<Project>(response);
}
