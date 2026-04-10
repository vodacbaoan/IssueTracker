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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { message?: string };

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  return readJson<Project[]>(response);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readJson<Project>(response);
}
