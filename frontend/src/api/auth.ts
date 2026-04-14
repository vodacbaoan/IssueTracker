import type { User } from './users';
import { apiFetch, readJson } from './client';

export interface AuthResponse {
  user: User;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const response = await apiFetch('/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readJson<AuthResponse>(response);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readJson<AuthResponse>(response);
}

export async function refreshSession(): Promise<AuthResponse> {
  const response = await apiFetch('/auth/refresh', {
    method: 'POST',
  });

  return readJson<AuthResponse>(response);
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await apiFetch('/auth/me');
  return readJson<AuthResponse>(response);
}

export async function logout(): Promise<void> {
  const response = await apiFetch('/auth/logout', {
    method: 'POST',
  });

  if (!response.ok) {
    await readJson<never>(response);
  }
}
