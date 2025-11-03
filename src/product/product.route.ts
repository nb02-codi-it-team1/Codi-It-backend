// import passport from 'passport';
// import validateDto from '../common/utils/validate.dto';
// import { Router } from 'express';
// import {
//   createProduct,
//   deleteProduct,
//   getProductDetail,
//   getProductInquiry,
//   getProducts,
//   postProductInquiry,
//   updateProduct,
// } from './product.controller';
// import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
// import { authorizeBuyer, authorizeSeller } from 'src/middleware/authorization';
// import { s3Upload, mapFileToBody } from '../middleware/s3-upload';

// const router = Router();

// // 상품 등록
// /**
//  * @swagger
//  * /api/products:
//  *   post:
//  *     summary: 상품 등록
//  *     tags: [Products]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             $ref: '#/components/schemas/ProductRequest'
//  *     responses:
//  *       201:
//  *         description: 등록된 상품 정보를 반환합니다.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductResponse'
//  *       400:
//  *         description: 이미 상품이 존재합니다.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductError400Response'
//  *       404:
//  *         description: 스토어 또는 카테고리를 찾을 수 없음
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductError404Response'
//  */
// router.post(
//   '/',
//   passport.authenticate('jwt', { session: false }),
//   authorizeSeller,
//   s3Upload.single('image'),
//   mapFileToBody,
//   validateDto(CreateProductDto),
//   createProduct
// );

// // 상품 목록 조회
// /**
//  * @swagger
//  * /api/products:
//  *   get:
//  *     summary: 상품 목록 조회
//  *     description: 페이징, 검색, 정렬이 가능합니다.
//  *     tags: [Products]
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema: { type: number, example: 1 }
//  *         description: 페이지 번호
//  *       - in: query
//  *         name: pageSize
//  *         schema: { type: number, example: 16 }
//  *         description: 한 페이지당 항목 수
//  *       - in: query
//  *         name: search
//  *         schema: { type: string, example: '가디건' }
//  *         description: 검색어
//  *       - in: query
//  *         name: sort
//  *         schema:
//  *           type: string
//  *           enum: [mostReviewed, recent, lowPrice, highPrice, highRating, salesRanking]
//  *           example: mostReviewed
//  *         description: 정렬 옵션
//  *       - in: query
//  *         name: priceMin
//  *         schema: { type: number, example: 0 }
//  *         description: 최소 가격
//  *       - in: query
//  *         name: priceMax
//  *         schema: { type: number, example: 20000 }
//  *         description: 최대 가격
//  *       - in: query
//  *         name: size
//  *         schema: { type: string, example: 'L' }
//  *         description: 사이즈 이름
//  *       - in: query
//  *         name: favoriteStore
//  *         schema: { type: string, example: 'CUID' }
//  *         description: 스토어 ID
//  *       - in: query
//  *         name: categoryName
//  *         schema: { type: string, example: 'bottom' }
//  *         description: 카테고리 이름
//  *     responses:
//  *       200:
//  *         description: 상품 리스트 및 메타정보 반환
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductListResponse'
//  *       404:
//  *         description: 상품을 찾을 수 없거나 카테고리가 없습니다.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductListError404Response'
//  */
// router.get('/', getProducts);

// // 상품 상세 조회
// /**
//  * @swagger
//  * /api/products/{productId}:
//  *   get:
//  *     summary: 상품 상세 조회
//  *     description: 특정 상품의 정보 및 메타 정보를 반환합니다.
//  *     tags: [Products]
//  *     parameters:
//  *       - in: path
//  *         name: productId
//  *         required: true
//  *         schema: { type: string }
//  *         description: 조회할 상품 ID
//  *     responses:
//  *       200:
//  *         description: 상품 정보 및 메타정보 반환
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailResponse'
//  *       404:
//  *         description: 상품을 찾을 수 없음
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
//  */
// router.get('/:productId', getProductDetail);

// // 상품 수정
// /**
//  * @swagger
//  * /api/products/{productId}:
//  *   patch:
//  *     summary: 상품 수정
//  *     description: 상품 정보를 수정합니다.
//  *     tags: [Products]
//  *     parameters:
//  *       - in: path
//  *         name: productId
//  *         required: true
//  *         schema: { type: string }
//  *         description: 조회할 상품 ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             required: ['id', 'stocks']
//  *             properties:
//  *               name: { type: string, example: '가디건', description: '상품 이름' }
//  *               price: { type: number, example: 20000, description: '정가'}
//  *               content: { type: string, description: '제품 상세 정보' }
//  *               image: { type: string, example: 'https://example.com/img.jpg', description: 'image url' }
//  *               discountRate: { type: number, example: 10, description: '할인율' }
//  *               discountStartTime: { type: string, example: '2025-06-01T00:00:00Z', description: '할인 시작 날짜' }
//  *               discountEndTime: { type: string, example: '2025-06-10T00:00:00Z', description: '할인 종료 날짜' }
//  *               categoryName: { type: string, example: 'bottom', description: '카테고리 이름' }
//  *               id: { type : string , description: '상품 ID '}
//  *               isSoldOut: { type: boolean, example: false, description: '매진 여부' }
//  *               stocks:
//  *                 type: array
//  *                 description: '상품 재고'
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     sizeId: { type: integer, example: 1 }
//  *                     quantity: { type: integer, example: 10 }
//  *     responses:
//  *       200:
//  *         description: 수정된 상품 정보 반환
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailResponse'
//  *       404:
//  *         description: 상품을 찾을 수 없거나 카테고리가 없습니다.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
//  */
// router.patch(
//   '/:productId',
//   passport.authenticate('jwt', { session: false }),
//   authorizeSeller,
//   s3Upload.single('image'),
//   mapFileToBody,
//   validateDto(UpdateProductDto),
//   updateProduct
// );

// // 상품 삭제
// /**
//  * @swagger
//  * /api/products/{productId}:
//  *   delete:
//  *     summary: 상품 삭제
//  *     description: 본인이 소유한 상품을 삭제합니다.
//  *     tags: [Products]
//  *     parameters:
//  *       - in: path
//  *         name: productId
//  *         required: true
//  *         schema: { type: string }
//  *         description: 삭제할 상품 ID
//  *     responses:
//  *       204:
//  *         description: 상품이 정상적으로 삭제되었습니다.
//  *       403:
//  *         description: 상품 삭제 권한이 없음
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductDeleteError403Response'
//  *       404:
//  *         description: 상품을 찾을 수 없음
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
//  */

// router.delete(
//   '/:productId',
//   passport.authenticate('jwt', { session: false }),
//   authorizeSeller,
//   deleteProduct
// );

// // 상품 문의 등록
// /**
//  * @swagger
//  * /api/products/{productId}/inquiries:
//  *   post:
//  *     summary: 상품 문의 등록
//  *     description: 상품에 대한 문의를 등록합니다.
//  *     tags: [Products]
//  *     parameters:
//  *       - in: path
//  *         name: productId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: 상품 ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/CreateInquiryRequest'
//  *     responses:
//  *       201:
//  *         description: 생성된 문의 정보를 반환합니다.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/InquiryResponse'
//  *       404:
//  *         description: 상품을 찾을 수 없음
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
//  */
// router.post(
//   '/:productId/inquiries',
//   passport.authenticate('jwt', { session: false }),
//   authorizeBuyer,
//   postProductInquiry
// );

// // 상품 모든 문의 조회
// /**
//  * @swagger
//  * /api/products/{productId}/inquiries:
//  *   get:
//  *     summary: 상품 문의 조회
//  *     description: 상품에 대한 모든 문의를 조회합니다.
//  *     tags: [Products]
//  *     parameters:
//  *       - in: path
//  *         name: productId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: 조회할 상품 ID
//  *     responses:
//  *       200:
//  *         description: 상품 문의 리스트 반환
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/InquiryWithUserResponse'
//  *       404:
//  *         description: 상품을 찾을 수 없음
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
//  */
// router.get('/:productId/inquiries', getProductInquiry);

// export default router;

import { Router } from 'express';
import passport from 'passport';
import validateDto from '../common/utils/validate.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { authorizeBuyer, authorizeSeller } from 'src/middleware/authorization';
import { s3Upload, mapFileToBody } from '../middleware/s3-upload';
import ProductController from './product.controller';
import ProductService from './product.service';
import ProductRepository from './product.repository';
import StoreRepository from 'src/stores/stores.repository';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaClient } from '@prisma/client/extension';

const ProductRouter = (prisma: PrismaClient, notificationService: NotificationService): Router => {
  const router = Router();

  // --- 서비스 & 컨트롤러 인스턴스 ---
  const productService = new ProductService(
    new ProductRepository(prisma),
    new StoreRepository(prisma),
    notificationService
  );
  const productController = new ProductController(productService);

  // 상품 등록
  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: 상품 등록
   *     tags: [Products]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             $ref: '#/components/schemas/ProductRequest'
   *     responses:
   *       201:
   *         description: 등록된 상품 정보를 반환합니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductResponse'
   *       400:
   *         description: 이미 상품이 존재합니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductError400Response'
   *       404:
   *         description: 스토어 또는 카테고리를 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductError404Response'
   */
  router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    s3Upload.single('image'),
    mapFileToBody,
    validateDto(CreateProductDto),
    productController.createProduct
  );

  // 상품 목록 조회
  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: 상품 목록 조회
   *     description: 페이징, 검색, 정렬이 가능합니다.
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: number, example: 1 }
   *         description: 페이지 번호
   *       - in: query
   *         name: pageSize
   *         schema: { type: number, example: 16 }
   *         description: 한 페이지당 항목 수
   *       - in: query
   *         name: search
   *         schema: { type: string, example: '가디건' }
   *         description: 검색어
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [mostReviewed, recent, lowPrice, highPrice, highRating, salesRanking]
   *           example: mostReviewed
   *         description: 정렬 옵션
   *       - in: query
   *         name: priceMin
   *         schema: { type: number, example: 0 }
   *         description: 최소 가격
   *       - in: query
   *         name: priceMax
   *         schema: { type: number, example: 20000 }
   *         description: 최대 가격
   *       - in: query
   *         name: size
   *         schema: { type: string, example: 'L' }
   *         description: 사이즈 이름
   *       - in: query
   *         name: favoriteStore
   *         schema: { type: string, example: 'CUID' }
   *         description: 스토어 ID
   *       - in: query
   *         name: categoryName
   *         schema: { type: string, example: 'bottom' }
   *         description: 카테고리 이름
   *     responses:
   *       200:
   *         description: 상품 리스트 및 메타정보 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductListResponse'
   *       404:
   *         description: 상품을 찾을 수 없거나 카테고리가 없습니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductListError404Response'
   */
  router.get('/', productController.getProducts);

  // 상품 상세 조회
  /**
   * @swagger
   * /api/products/{productId}:
   *   get:
   *     summary: 상품 상세 조회
   *     description: 특정 상품의 정보 및 메타 정보를 반환합니다.
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: string }
   *         description: 조회할 상품 ID
   *     responses:
   *       200:
   *         description: 상품 정보 및 메타정보 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailResponse'
   *       404:
   *         description: 상품을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
   */
  router.get('/:productId', productController.getProductDetail);

  // 상품 수정
  /**
   * @swagger
   * /api/products/{productId}:
   *   patch:
   *     summary: 상품 수정
   *     description: 상품 정보를 수정합니다.
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: string }
   *         description: 조회할 상품 ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: ['id', 'stocks']
   *             properties:
   *               name: { type: string, example: '가디건', description: '상품 이름' }
   *               price: { type: number, example: 20000, description: '정가'}
   *               content: { type: string, description: '제품 상세 정보' }
   *               image: { type: string, example: 'https://example.com/img.jpg', description: 'image url' }
   *               discountRate: { type: number, example: 10, description: '할인율' }
   *               discountStartTime: { type: string, example: '2025-06-01T00:00:00Z', description: '할인 시작 날짜' }
   *               discountEndTime: { type: string, example: '2025-06-10T00:00:00Z', description: '할인 종료 날짜' }
   *               categoryName: { type: string, example: 'bottom', description: '카테고리 이름' }
   *               id: { type : string , description: '상품 ID '}
   *               isSoldOut: { type: boolean, example: false, description: '매진 여부' }
   *               stocks:
   *                 type: array
   *                 description: '상품 재고'
   *                 items:
   *                   type: object
   *                   properties:
   *                     sizeId: { type: integer, example: 1 }
   *                     quantity: { type: integer, example: 10 }
   *     responses:
   *       200:
   *         description: 수정된 상품 정보 반환
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailResponse'
   *       404:
   *         description: 상품을 찾을 수 없거나 카테고리가 없습니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
   */
  router.patch(
    '/:productId',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    s3Upload.single('image'),
    mapFileToBody,
    validateDto(UpdateProductDto),
    productController.updateProduct
  );

  // 상품 삭제
  /**
   * @swagger
   * /api/products/{productId}:
   *   delete:
   *     summary: 상품 삭제
   *     description: 본인이 소유한 상품을 삭제합니다.
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema: { type: string }
   *         description: 삭제할 상품 ID
   *     responses:
   *       204:
   *         description: 상품이 정상적으로 삭제되었습니다.
   *       403:
   *         description: 상품 삭제 권한이 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductDeleteError403Response'
   *       404:
   *         description: 상품을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
   */
  router.delete(
    '/:productId',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    productController.deleteProduct
  );

  // 상품 문의 등록
  /**
   * @swagger
   * /api/products/{productId}/inquiries:
   *   post:
   *     summary: 상품 문의 등록
   *     description: 상품에 대한 문의를 등록합니다.
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *         description: 상품 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateInquiryRequest'
   *     responses:
   *       201:
   *         description: 생성된 문의 정보를 반환합니다.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InquiryResponse'
   *       404:
   *         description: 상품을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
   */
  router.post(
    '/:productId/inquiries',
    passport.authenticate('jwt', { session: false }),
    authorizeBuyer,
    productController.postProductInquiry
  );

  // 상품 모든 문의 조회
  /**
   * @swagger
   * /api/products/{productId}/inquiries:
   *   get:
   *     summary: 상품 문의 조회
   *     description: 상품에 대한 모든 문의를 조회합니다.
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *         description: 조회할 상품 ID
   *     responses:
   *       200:
   *         description: 상품 문의 리스트 반환
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/InquiryWithUserResponse'
   *       404:
   *         description: 상품을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProductUpdateDetailError404Response'
   */
  router.get('/:productId/inquiries', productController.getProductInquiry);

  return router;
};

export default ProductRouter;
