import { Request, Response, NextFunction } from 'express';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import UserService from './user.service';
import { NotFoundError } from '../common/errors/error-type';

export default class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  // 회원가입
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateUserDto = req.body;

      const response = await this.userService.createUser(data);

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  // 내 정보 조회
  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new NotFoundError('유저를 찾을 수 없습니다.');
      }

      const response = await this.userService.getUser(userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // 내 정보 수정
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new NotFoundError('유저를 찾을 수 없습니다.');
      }
      const data: UpdateUserDto = req.body;

      const response = await this.userService.updateUser(userId, data);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // 관심 스토어 조회
  getUserLikedStores = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new NotFoundError('유저를 찾을 수 없습니다.');
      }

      const response = await this.userService.getUserLikedStores(userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // 회원 탈퇴
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new NotFoundError('유저를 찾을 수 없습니다.');
      }

      const response = await this.userService.deleteUser(userId);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
