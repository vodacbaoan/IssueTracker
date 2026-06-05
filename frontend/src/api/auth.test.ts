import { describe, expect, it, vi } from 'vitest';
import { apiFetch, readJson } from './client';
import { getCurrentUser, login, logout, signup, type AuthResponse } from './auth';
import type { User } from './users';

vi.mock('./client', () => ({
  apiFetch: vi.fn(),
  readJson: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);
const readJsonMock = vi.mocked(readJson);

const user: User = {
  id: 'user-1',
  name: 'Taylor',
  email: 'taylor@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('auth api', () => {
  it('submits signup as JSON and returns the parsed auth response', async () => {
    const response = new Response('{}');
    const authResponse: AuthResponse = { user };
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue(authResponse);

    const result = await signup({
      name: user.name,
      email: user.email,
      password: 'password123',
    });

    expect(result).toBe(authResponse);
    expect(apiFetchMock).toHaveBeenCalledWith('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        password: 'password123',
      }),
    });
    expect(readJsonMock).toHaveBeenCalledWith(response);
  });

  it('submits login as JSON', async () => {
    const response = new Response('{}');
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue({ user });

    await login({
      email: user.email,
      password: 'password123',
    });

    expect(apiFetchMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: 'password123',
      }),
    });
  });

  it('loads the current user session', async () => {
    const response = new Response('{}');
    const authResponse: AuthResponse = { user };
    apiFetchMock.mockResolvedValue(response);
    readJsonMock.mockResolvedValue(authResponse);

    const result = await getCurrentUser();

    expect(result).toBe(authResponse);
    expect(apiFetchMock).toHaveBeenCalledWith('/auth/me');
    expect(readJsonMock).toHaveBeenCalledWith(response);
  });

  it('does not parse logout response when logout succeeds', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await logout();

    expect(apiFetchMock).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
    });
    expect(readJsonMock).not.toHaveBeenCalled();
  });
});
