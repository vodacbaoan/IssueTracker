import type { Label } from './labels';
import type { User } from './users';
import { apiFetch, readJson } from './client';

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
  body: string;
}

export async function getIssues(projectId: string): Promise<Issue[]> {
  const response = await apiFetch(`/projects/${encodeURIComponent(projectId)}/issues`);
  return readJson<Issue[]>(response);
}

export async function createIssue(projectId: string, input: CreateIssueInput): Promise<Issue> {
  const response = await apiFetch(`/projects/${encodeURIComponent(projectId)}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }, { retryOnUnauthorized: true });

  return readJson<Issue>(response);
}

export async function updateIssueStatus(
  projectId: string,
  issueId: string,
  status: IssueStatus,
): Promise<Issue> {
  const response = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
    { retryOnUnauthorized: true },
  );

  return readJson<Issue>(response);
}

export async function updateIssueAssignee(
  projectId: string,
  issueId: string,
  assigneeId: string | null,
): Promise<Issue> {
  const response = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/assignee`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assigneeId }),
    },
    { retryOnUnauthorized: true },
  );

  return readJson<Issue>(response);
}

export async function updateIssueLabels(
  projectId: string,
  issueId: string,
  labelIds: string[],
): Promise<Issue> {
  const response = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/labels`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ labelIds }),
    },
    { retryOnUnauthorized: true },
  );

  return readJson<Issue>(response);
}

export async function createIssueComment(
  projectId: string,
  issueId: string,
  input: CreateIssueCommentInput,
): Promise<Issue> {
  const response = await apiFetch(
    `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    { retryOnUnauthorized: true },
  );

  return readJson<Issue>(response);
}
