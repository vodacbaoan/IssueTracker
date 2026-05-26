import { createHash } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import type { AppConfig } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

const encoder = new TextEncoder();

interface AccessTokenPayload {
  userId: string;
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

function getCookieBaseOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: '/',
  };
}

function getAccessSecret(config: AppConfig): Uint8Array {
  return encoder.encode(config.JWT_ACCESS_SECRET);
}

function getRefreshSecret(config: AppConfig): Uint8Array {
  return encoder.encode(config.JWT_REFRESH_SECRET);
}

export function getAccessTokenMaxAgeMs(config: AppConfig): number {
  return config.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000;
}

export function getRefreshTokenMaxAgeMs(config: AppConfig): number {
  return config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export function getRefreshTokenExpiresAt(config: AppConfig): Date {
  return new Date(Date.now() + getRefreshTokenMaxAgeMs(config));
}

export async function createAccessToken(
  userId: string,
  config: AppConfig,
): Promise<string> {
  return new SignJWT({ type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${config.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(getAccessSecret(config));
}

export async function createRefreshToken(
  userId: string,
  sessionId: string,
  config: AppConfig,
): Promise<string> {
  return new SignJWT({ type: 'refresh', sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${config.REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(getRefreshSecret(config));
}

export async function verifyAccessToken(
  token: string,
  config: AppConfig,
): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret(config));

    if (payload.type !== 'access' || typeof payload.sub !== 'string') {
      throw new UnauthorizedError('Invalid access token');
    }

    return { userId: payload.sub };
  } catch (error) {
    throw error instanceof UnauthorizedError
      ? error
      : new UnauthorizedError('Invalid or expired access token');
  }
}

export async function tryVerifyAccessToken(
  token: string,
  config: AppConfig,
): Promise<AccessTokenPayload | null> {
  try {
    return await verifyAccessToken(token, config);
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
  config: AppConfig,
): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret(config));

    if (
      payload.type !== 'refresh' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string'
    ) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
    };
  } catch (error) {
    throw error instanceof UnauthorizedError
      ? error
      : new UnauthorizedError('Invalid or expired refresh token');
  }
}

export async function tryVerifyRefreshToken(
  token: string,
  config: AppConfig,
): Promise<RefreshTokenPayload | null> {
  try {
    return await verifyRefreshToken(token, config);
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function readCookie(cookieHeader: string | undefined, cookieName: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const rawCookie of cookieHeader.split(';')) {
    const trimmedCookie = rawCookie.trim();

    if (!trimmedCookie) {
      continue;
    }

    const separatorIndex = trimmedCookie.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmedCookie.slice(0, separatorIndex);

    if (name !== cookieName) {
      continue;
    }

    const value = trimmedCookie.slice(separatorIndex + 1);
    return decodeURIComponent(value);
  }

  return undefined;
}

export function setAuthCookies(
  response: Response,
  config: AppConfig,
  input: { accessToken: string; refreshToken: string },
): void {
  response.cookie(ACCESS_TOKEN_COOKIE_NAME, input.accessToken, {
    ...getCookieBaseOptions(config),
    maxAge: getAccessTokenMaxAgeMs(config),
  });
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, input.refreshToken, {
    ...getCookieBaseOptions(config),
    maxAge: getRefreshTokenMaxAgeMs(config),
  });
}

export function clearAuthCookies(response: Response, config: AppConfig): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, getCookieBaseOptions(config));
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getCookieBaseOptions(config));
}
