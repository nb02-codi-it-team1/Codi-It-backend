import { Router } from 'express';
import prisma from '../common/prisma/client';
import UserRepository from './auth.repository';
import AuthService from './auth.service';
import AuthController from './auth.controller';
import validateDto from '../common/utils/validate.dto';
import { LoginDto } from './dtos/login.dto';

const router = Router();
const userRepository = new UserRepository(prisma);
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/login', validateDto(LoginDto), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
