import type { NextFunction, Request, Response } from 'express';
import type { UserService } from './user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const users = await this.userService.listUsers();
      response.json(users);
    } catch (error) {
      next(error);
    }
  };
}
