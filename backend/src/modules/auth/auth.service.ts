import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { AppConfig } from '../../config/env';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import type { PublicUser } from '../users/user.types';
import type { AuthRepository } from './auth.repository';
import type { LoginBody, SignupBody } from './auth.schema';
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiresAt,
  hashToken,
  tryVerifyRefreshToken,
  verifyRefreshToken,
} from './auth.tokens';
import type { AuthSessionResult } from './auth.types';

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly config: AppConfig,
  ) {}

  private async createSessionForUser(user: PublicUser): Promise<AuthSessionResult> {
    const sessionId = randomUUID();
    const refreshToken = await createRefreshToken(user.id, sessionId, this.config);

    await this.authRepository.createRefreshSession({
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt(this.config),
    });

    const accessToken = await createAccessToken(user.id, this.config);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async signup(input: SignupBody): Promise<AuthSessionResult> {
    const existingUser = await this.authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.authRepository.createUser({
      ...input,
      passwordHash,
    });

    return this.createSessionForUser(user);
  }

  async login(input: LoginBody): Promise<AuthSessionResult> {
    const user = await this.authRepository.findUserByEmail(input.email);

    if (!user?.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.createSessionForUser({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    });
  }

  async refresh(refreshToken: string): Promise<AuthSessionResult> {
    const payload = await verifyRefreshToken(refreshToken, this.config);
    const session = await this.authRepository.findRefreshSessionById(payload.sessionId);

    if (
      !session ||
      session.userId !== payload.userId ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.tokenHash !== hashToken(refreshToken)
    ) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    const user = await this.authRepository.findUserById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('Invalid session user');
    }

    const nextRefreshToken = await createRefreshToken(user.id, session.id, this.config);

    await this.authRepository.rotateRefreshSession(
      session.id,
      hashToken(nextRefreshToken),
      getRefreshTokenExpiresAt(this.config),
    );

    const accessToken = await createAccessToken(user.id, this.config);

    return {
      user,
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const payload = await tryVerifyRefreshToken(refreshToken, this.config);

    if (!payload) {
      return;
    }

    const session = await this.authRepository.findRefreshSessionById(payload.sessionId);

    if (
      !session ||
      session.userId !== payload.userId ||
      session.tokenHash !== hashToken(refreshToken)
    ) {
      return;
    }

    await this.authRepository.revokeRefreshSession(session.id);
  }

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedError('Invalid session user');
    }

    return user;
  }
}
