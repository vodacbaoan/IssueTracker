import type { PublicUser } from '../users/user.types';

export interface AuthSessionResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}
