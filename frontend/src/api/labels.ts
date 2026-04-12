export interface Label {
  id: string;
  name: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { message?: string };

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function getLabels(): Promise<Label[]> {
  const response = await fetch(`${API_BASE_URL}/labels`);
  return readJson<Label[]>(response);
}
