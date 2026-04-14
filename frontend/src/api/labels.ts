import { apiFetch, readJson } from './client';

export interface Label {
  id: string;
  name: string;
  createdAt: string;
}

export async function getLabels(): Promise<Label[]> {
  const response = await apiFetch('/labels');
  return readJson<Label[]>(response);
}
