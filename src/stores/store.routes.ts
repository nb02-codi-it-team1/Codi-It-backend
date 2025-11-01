import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import StoreRepository from './stores.repository';
import StoreService from './stores.service';
import StoreController from './stores.controller';
import validateDto from '../common/utils/validate.dto';
import { CreateStoreDto } from './dtos/create.dto';
import { UpdateStoreDto } from './dtos/update.dto';
import { s3Upload, mapFileToBody } from '../middleware/s3-upload';
import passport from 'passport';
import { authorizeSeller, requireSellerType } from '../middleware/authorization';

const StoresRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const storeRepository = new StoreRepository(prisma);
  const storeService = new StoreService(storeRepository);
  const storeController = new StoreController(storeService);

  /**
   * @swagger
   * /api/stores:
   *   post:
   *     summary: 내 스토어 등록
   *     description: 로그인한 사용자가 자신의 스토어를 등록합니다. (1개만 가능)
   *     tags: [Stores]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/StoreCreateRequest'
   *     responses:
   *       201:
   *         description: 등록된 스토어 정보 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StoreResponse'
   *
   */
  router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    requireSellerType,
    s3Upload.single('image'),
    mapFileToBody,
    validateDto(CreateStoreDto),
    storeController.createStore
  );

  /**
   * @swagger
   * /api/stores/{storeId}:
   *   patch:
   *     summary:  스토어 정보 수정
   *     description: 내 스토어 정보 수정입니다.
   *     tags: [Stores]
   *     parameters:
   *       - in: path
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           example: CUID
   *         description: 수정할 스토어 ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/StoreUpdateRequest'
   *     responses:
   *       200:
   *         description: 수정된 스토어 정보 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UpdateStoreResponse'
   */

  router.patch(
    '/:storeId',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    s3Upload.single('image'),
    mapFileToBody,
    validateDto(UpdateStoreDto),
    storeController.updateStore
  );

  /**
   * @swagger
   * /api/stores/{storeId}:
   *   get:
   *     summary: 스토어 상세 조회
   *     tags: [Stores]
   *     parameters:
   *       - in: path
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           example: storeId
   *         description: 조회할 스토어 ID
   *     responses:
   *       200:
   *         description: 스토어 정보를 반환합니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StoreDetailResponse'
   */

  router.get(
    '/:storeId',
    passport.authenticate('jwt', { session: false }),
    storeController.getStoreDetails
  );

  /**
   * @swagger
   * /api/stores/detail/my:
   *   get:
   *     summary: 내 스토어 상세 조회
   *     description: 내 스토어 상세 조회입니다.
   *     tags: [Stores]
   *     responses:
   *       200:
   *         description: 내 스토어 정보 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MyStoreDetailResponse'
   */

  router.get(
    '/detail/my',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    storeController.getMyStore
  );

  /**
   * @swagger
   * /api/stores/detail/my/product:
   *   get:
   *     summary: 내 스토어 등록 상품 조회
   *     description: 내 스토어에 등록된 상품 리스트를 페이지네이션과 함께 조회합니다.
   *     tags: [Stores]
   *     parameters:
   *       - in: query
   *         name: page
   *         required: false
   *         schema:
   *           type: integer
   *           example: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: pageSize
   *         required: false
   *         schema:
   *           type: integer
   *           example: 10
   *         description: 페이지당 상품 수
   *     responses:
   *       200:
   *         description: 스토어 등록 상품 정보를 반환합니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StoreProductListResponse'
   */

  router.get(
    '/detail/my/product',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    storeController.getMyStoreProducts
  );

  /**
   * @swagger
   * /api/stores/{storeId}/favorite:
   *   post:
   *     summary: 관심 스토어 등록
   *     description: 특정 스토어를 관심 스토어로 등록합니다.
   *     tags: [Stores]
   *     parameters:
   *       - in: path
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           example: storeId
   *         description: 관심 스토어 ID
   *     responses:
   *       201:
   *         description: 관심 스토어 등록 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FavoriteStoreRegisterResponse'
   */
  router.post(
    '/:storeId/favorite',
    passport.authenticate('jwt', { session: false }),
    storeController.registerStoreLike
  );

  /**
   * @swagger
   * /api/stores/{storeId}/favorite:
   *   delete:
   *     summary: 관심 스토어 해제
   *     description: 특정 스토어를 관심 스토어에서 해제합니다.
   *     tags: [Stores]
   *     parameters:
   *       - in: path
   *         name: storeId
   *         required: true
   *         schema:
   *           type: string
   *           example: storeId
   *         description: 관심 스토어 ID
   *     responses:
   *       200:
   *         description: 관심 스토어 해제 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FavoriteStoreUnregisterResponse'
   */
  router.delete(
    '/:storeId/favorite',
    passport.authenticate('jwt', { session: false }),
    storeController.deleteStoreLike
  );

  return router;
};

export default StoresRouter;
