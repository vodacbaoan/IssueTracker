import type { PrismaClient, RefreshSession } from '@prisma/client';
import type { SignupBody } from './auth.schema';
import {
  authUserSelect,
  publicUserSelect,
  type AuthUser,
  type PublicUser,
} from '../users/user.types';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserByEmail(email: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  }

  findUserById(userId: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
  }

  createUser(input: SignupBody & { passwordHash: string }): Promise<PublicUser> {
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
      select: publicUserSelect,
    });
  }

  createRefreshSession(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshSession> {
    return this.prisma.refreshSession.create({
      data: input,
    });
  }

  findRefreshSessionById(sessionId: string): Promise<RefreshSession | null> {
    return this.prisma.refreshSession.findUnique({
      where: { id: sessionId },
    });
  }

  rotateRefreshSession(
    sessionId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshSession> {
    return this.prisma.refreshSession.update({
      where: { id: sessionId },
      data: {
        tokenHash,
        expiresAt,
        revokedAt: null,
      },
    });
  }

  revokeRefreshSession(sessionId: string): Promise<void> {
    return this.prisma.refreshSession
      .updateMany({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
        },
      })
      .then(() => undefined);
  }
}
