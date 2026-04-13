import type { Label } from './labels';
import type { User } from './users';

export type IssueStatus = 'todo' | 'in_progress' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high';

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  author: User;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  assigneeId: string | null;
  labels: Label[];
  comments: IssueComment[];
  title: string;
  description: string | null;
  priority: IssuePriority;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  priority: IssuePriority;
  assigneeId: string | null;
  labelIds: string[];
}

export interface CreateIssueCommentInput {
  authorId: string;
  body: string;
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

export async function getIssues(projectId: string): Promise<Issue[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/issues`);
  return readJson<Issue[]>(response);
}

export async function createIssue(projectId: string, input: CreateIssueInput): Promise<Issue> {
  const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readJson<Issue>(response);
}

export async function updateIssueStatus(
  projectId: string,
  issueId: string,
  status: IssueStatus,
): Promise<Issue> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
  );

  return readJson<Issue>(response);
}

export async function updateIssueAssignee(
  projectId: string,
  issueId: string,
  assigneeId: string | null,
): Promise<Issue> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/assignee`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assigneeId }),
    },
  );

  return readJson<Issue>(response);
}

export async function updateIssueLabels(
  projectId: string,
  issueId: string,
  labelIds: string[],
): Promise<Issue> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/labels`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labelIds }),
    },
  );

  return readJson<Issue>(response);
}

export async function createIssueComment(
  projectId: string,
  issueId: string,
  input: CreateIssueCommentInput,
): Promise<Issue> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  return readJson<Issue>(response);
}
