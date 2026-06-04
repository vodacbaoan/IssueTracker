import { apiFetch, readJson } from './client';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  role: WorkspaceRole;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await apiFetch('/workspaces', {}, { retryOnUnauthorized: true });
  return readJson<Workspace[]>(response);
}
