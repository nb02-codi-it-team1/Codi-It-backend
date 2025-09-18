import { Router } from 'express';
import prisma from '../common/prisma/client';
import UserRepository from './user.repository';
import UserService from './user.service';
import UserController from './user.controller';
import validateDto from '../common/utils/validate.dto';
import { CreateUserDto } from './dtos/create-user.dto';

const router = Router();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// 회원가입 API
router.post('/', validateDto(CreateUserDto), userController.createUser);

export default router;
