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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인 및 Access/Refresh 토큰 발급
 *     description: 사용자의 이메일과 비밀번호로 로그인하고, Access Token과 Refresh Token을 발급합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       201:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: 잘못된 요청입니다
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       401:
 *         description: 로그인 실패했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401Response'
 *       404:
 *         description: 사용자를 찾을 수 없습니다
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.post('/login', validateDto(LoginDto), authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh Token으로 Access Token 재발급
 *     tags: [Auth]
 *     description: 유효한 Refresh Token을 사용하여 새로운 Access Token을 발급합니다.
 *     responses:
 *       200:
 *         description: Access Token 재발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshError400Response'
 *       401:
 *         description: Unauthorized - 유효하지 않거나 만료된 Refresh Token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshError401Response'
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: 로그인된 사용자의 세션(리프레시 토큰)을 제거합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *       401:
 *         description: 인증되지 않음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutError401Response'
 */
router.post('/logout', authController.logout);

export default router;
