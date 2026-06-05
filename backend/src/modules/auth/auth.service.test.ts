import type { RefreshSession } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import type { PublicUser } from '../users/user.types';
import type { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { createRefreshToken, hashToken } from './auth.tokens';

type MockAuthRepository = Pick<
  AuthRepository,
  | 'findUserByEmail'
  | 'findUserById'
  | 'createUser'
  | 'createRefreshSession'
  | 'findRefreshSessionById'
  | 'rotateRefreshSession'
  | 'revokeRefreshSession'
>;

const config: AppConfig = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 3000,
  DATABASE_URL: 'postgresql://user:password@localhost:5432/test',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  ACCESS_TOKEN_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 7,
};

const publicUser: PublicUser = {
  id: 'user-1',
  name: 'Taylor',
  email: 'taylor@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const createAuthRepository = () =>
  ({
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
    createRefreshSession: vi.fn(),
    findRefreshSessionById: vi.fn(),
    rotateRefreshSession: vi.fn(),
    revokeRefreshSession: vi.fn(),
  }) satisfies MockAuthRepository;

const createService = (authRepository: MockAuthRepository) =>
  new AuthService(authRepository as unknown as AuthRepository, config);

const refreshSession = (overrides: Partial<RefreshSession> = {}) =>
  ({
    id: 'session-1',
    userId: publicUser.id,
    tokenHash: 'token-hash',
    expiresAt: new Date('2099-02-01T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) satisfies RefreshSession;

describe('AuthService', () => {
  it('throws ConflictError when signing up with an existing email', async () => {
    const authRepository = createAuthRepository();
    authRepository.findUserByEmail.mockResolvedValue({
      ...publicUser,
      passwordHash: 'hash',
    });
    const service = createService(authRepository);

    await expect(
      service.signup({
        name: publicUser.name,
        email: publicUser.email,
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(authRepository.createUser).not.toHaveBeenCalled();
    expect(authRepository.createRefreshSession).not.toHaveBeenCalled();
  });

  it('creates a user and refresh session during signup', async () => {
    const authRepository = createAuthRepository();
    authRepository.findUserByEmail.mockResolvedValue(null);
    authRepository.createUser.mockResolvedValue(publicUser);
    authRepository.createRefreshSession.mockResolvedValue(refreshSession());
    const service = createService(authRepository);

    const result = await service.signup({
      name: publicUser.name,
      email: publicUser.email,
      password: 'password123',
    });

    expect(result.user).toBe(publicUser);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(authRepository.createUser).toHaveBeenCalledWith({
      name: publicUser.name,
      email: publicUser.email,
      password: 'password123',
      passwordHash: expect.any(String),
    });
    expect(authRepository.createRefreshSession).toHaveBeenCalledWith({
      id: expect.any(String),
      userId: publicUser.id,
      tokenHash: hashToken(result.refreshToken),
      expiresAt: expect.any(Date),
    });
  });

  it('throws UnauthorizedError when login credentials are invalid', async () => {
    const authRepository = createAuthRepository();
    authRepository.findUserByEmail.mockResolvedValue(null);
    const service = createService(authRepository);

    await expect(
      service.login({
        email: publicUser.email,
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(authRepository.createRefreshSession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when refreshing a missing session', async () => {
    const refreshToken = await createRefreshToken(publicUser.id, 'session-1', config);
    const authRepository = createAuthRepository();
    authRepository.findRefreshSessionById.mockResolvedValue(null);
    const service = createService(authRepository);

    await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedError);

    expect(authRepository.rotateRefreshSession).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh session', async () => {
    const refreshToken = await createRefreshToken(publicUser.id, 'session-1', config);
    const authRepository = createAuthRepository();
    authRepository.findRefreshSessionById.mockResolvedValue(
      refreshSession({ tokenHash: hashToken(refreshToken) }),
    );
    authRepository.findUserById.mockResolvedValue(publicUser);
    authRepository.rotateRefreshSession.mockResolvedValue(refreshSession());
    const service = createService(authRepository);

    const result = await service.refresh(refreshToken);

    expect(result.user).toBe(publicUser);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(authRepository.rotateRefreshSession).toHaveBeenCalledWith(
      'session-1',
      hashToken(result.refreshToken),
      expect.any(Date),
    );
  });

  it('ignores logout without a refresh token', async () => {
    const authRepository = createAuthRepository();
    const service = createService(authRepository);

    await service.logout(undefined);

    expect(authRepository.findRefreshSessionById).not.toHaveBeenCalled();
    expect(authRepository.revokeRefreshSession).not.toHaveBeenCalled();
  });

  it('returns the current user', async () => {
    const authRepository = createAuthRepository();
    authRepository.findUserById.mockResolvedValue(publicUser);
    const service = createService(authRepository);

    const result = await service.getCurrentUser(publicUser.id);

    expect(result).toBe(publicUser);
    expect(authRepository.findUserById).toHaveBeenCalledWith(publicUser.id);
  });
});
