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
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 회원가입
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterRequest'
 *     responses:
 *       201:
 *         description: 회원 가입 성공한 유저의 값을 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserRegisterResponse'
 *       409:
 *         description: 이미 존재하는 유저
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error409Response'
 */
router.post('/', validateDto(CreateUserDto), userController.createUser);

// 내 정보 조회
/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: 내 정보 조회
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 내 정보 조회 성공 및 유저 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserMeResponse'
 *       404:
 *         description: 유저 정보 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersMeError404Response'
 */

router.get('/me', passport.authenticate('jwt', { session: false }), userController.getUser);

// 내 정보 수정
/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: 내 정보 수정
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: 내 정보 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserMeResponse'
 *       404:
 *         description: 존재하지 않는 유저
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersUpdateError404Response'
 */

router.patch(
  '/me',
  passport.authenticate('jwt', { session: false }),
  s3Upload.single('image'),
  mapFileToBody,
  validateDto(UpdateUserDto),
  userController.updateUser
);

// 관심 스토어 조회
/**
 * @swagger
 * /api/users/me/likes:
 *   get:
 *     summary: 내 관심 스토어 조회
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 내 관심 스토어 조회 성공 및 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FavoriteStoreItem'
 *       404:
 *         description: 존재하지 않는 유저
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersFavoriteStoreError404Response'
 */
router.get(
  '/me/likes',
  passport.authenticate('jwt', { session: false }),
  userController.getUserLikedStores
);

// 회원 탈퇴
/**
 * @swagger
 * /api/users/delete:
 *   delete:
 *     summary: 회원 탈퇴
 *     description: 현재 로그인한 사용자의 계정을 삭제합니다
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDeleteError400Response'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDeleteError401Response'
 *       404:
 *         description: 존재하지 않는 유저
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserDeleteError404Response'
 */
router.delete('/me', passport.authenticate('jwt', { session: false }), userController.deleteUser);

export default router;
