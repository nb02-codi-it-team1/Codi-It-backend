import { Request, Response, NextFunction } from 'express';
import { CreateUserDto } from './dtos/create-user.dto';
import UserService from './user-service';

export default class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateUserDto = req.body;

      const response = await this.userService.createUser(data);

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
