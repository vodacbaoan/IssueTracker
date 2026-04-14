const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface ApiFetchOptions {
  retryOnUnauthorized?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildRequestInit(init: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    ...init,
  };
}

async function refreshAuthSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, buildRequestInit({ method: 'POST' }))
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<Response> {
  const requestInit = buildRequestInit(init);
  let response = await fetch(`${API_BASE_URL}${path}`, requestInit);

  if (options.retryOnUnauthorized && response.status === 401 && path !== '/auth/refresh') {
    const refreshSucceeded = await refreshAuthSession();

    if (refreshSucceeded) {
      response = await fetch(`${API_BASE_URL}${path}`, requestInit);
    }
  }

  return response;
}

export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text.length > 0 ? (JSON.parse(text) as T | { message?: string }) : undefined;

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Request failed';

    throw new ApiError(message, response.status);
  }

  return data as T;
}
