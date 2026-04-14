import type { UserRepository } from './user.repository';
import type { PublicUser } from './user.types';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  listUsers(): Promise<PublicUser[]> {
    return this.userRepository.list();
  }
}
