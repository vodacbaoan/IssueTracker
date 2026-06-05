import { describe, expect, it, vi } from 'vitest';
import type { UserRepository } from './user.repository';
import { UserService } from './user.service';
import type { PublicUser } from './user.types';

type MockUserRepository = Pick<UserRepository, 'list'>;

const createUserRepository = () =>
  ({
    list: vi.fn(),
  }) satisfies MockUserRepository;

const createService = (userRepository: MockUserRepository) =>
  new UserService(userRepository as unknown as UserRepository);

describe('UserService', () => {
  it('lists users from the repository', async () => {
    const users: PublicUser[] = [];
    const userRepository = createUserRepository();
    userRepository.list.mockResolvedValue(users);
    const service = createService(userRepository);

    const result = await service.listUsers();

    expect(result).toBe(users);
    expect(userRepository.list).toHaveBeenCalledOnce();
  });
});
