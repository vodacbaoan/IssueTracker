import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, readJson } from './client';

describe('readJson', () => {
  it('returns parsed JSON from a successful response', async () => {
    const body = [{ id: 'workspace-1', name: 'Engineering' }];
    const response = new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await expect(readJson(response)).resolves.toEqual(body);
  });

  it('throws ApiError with the response message when the response fails', async () => {
    const response = new Response(JSON.stringify({ message: 'Nope' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await expect(readJson(response)).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Nope',
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it('throws ApiError with a fallback message when the error body is empty', async () => {
    const response = new Response('', { status: 500 });

    await expect(readJson(response)).rejects.toMatchObject({
      message: 'Request failed',
      status: 500,
    });
  });
});

describe('apiFetch', () => {
  it('calls the API with credentials included', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/workspaces');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/workspaces', {
      credentials: 'include',
    });
  });

  it('refreshes auth and retries once after an unauthorized response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await apiFetch('/workspaces', {}, { retryOnUnauthorized: true });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/v1/workspaces', {
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3000/api/v1/auth/refresh', {
      credentials: 'include',
      method: 'POST',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:3000/api/v1/workspaces', {
      credentials: 'include',
    });
  });

  it('does not retry the refresh endpoint when it returns unauthorized', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await apiFetch(
      '/auth/refresh',
      { method: 'POST' },
      { retryOnUnauthorized: true },
    );

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
