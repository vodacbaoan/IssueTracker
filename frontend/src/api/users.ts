import { apiFetch, readJson } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export async function getUsers(): Promise<User[]> {
  const response = await apiFetch('/users');
  return readJson<User[]>(response);
}
