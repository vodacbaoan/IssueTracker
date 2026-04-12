import type { User } from '@prisma/client';
import type { UserRepository } from './user.repository';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  listUsers(): Promise<User[]> {
    return this.userRepository.list();
  }
}
