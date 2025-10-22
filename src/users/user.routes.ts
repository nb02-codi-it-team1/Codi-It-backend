import { Router } from 'express';
import prisma from '../common/prisma/client';
import UserRepository from './user.repository';
import UserService from './user.service';
import UserController from './user.controller';
import validateDto from '../common/utils/validate.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import passport from 'passport';
import { s3Upload, mapFileToBody } from '../middleware/s3-upload';

const router = Router();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// 회원가입
router.post('/', validateDto(CreateUserDto), userController.createUser);
// 내 정보 조회
router.get('/me', passport.authenticate('jwt', { session: false }), userController.getUser);
// 내 정보 수정
router.patch(
  '/me',
  passport.authenticate('jwt', { session: false }),
  s3Upload.single('image'),
  mapFileToBody,
  validateDto(UpdateUserDto),
  userController.updateUser
);
// 관심 스토어 조회
router.get(
  '/me/likes',
  passport.authenticate('jwt', { session: false }),
  userController.getUserLikedStores
);
// 회원 탈퇴
router.delete('/me', passport.authenticate('jwt', { session: false }), userController.deleteUser);

export default router;
