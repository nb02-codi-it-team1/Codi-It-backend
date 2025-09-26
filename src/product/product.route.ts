import passport from 'passport';
import validateDto from '../common/utils/validate.dto';
import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  getProductInquiry,
  getProducts,
  postProductInquiry,
  updateProduct,
} from './product.controller';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { authorizeBuyer, authorizeSeller } from 'src/middleware/authorization';
import { s3Upload, mapFileToBody } from '../middleware/s3-upload';

const router = Router();

// 상품 등록
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  s3Upload.single('image'),
  mapFileToBody,
  validateDto(CreateProductDto),
  createProduct
);

// 상품 목록 조회
router.get('/', getProducts);

// 상품 상세 조회
router.get('/:productId', getProductDetail);

// 상품 수정
router.patch(
  '/:productId',
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  s3Upload.single('image'),
  mapFileToBody,
  validateDto(UpdateProductDto),
  updateProduct
);

// 상품 삭제
router.delete(
  '/:productId',
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  deleteProduct
);

// 상품 문의 등록
router.post(
  '/:productId/inquiries',
  passport.authenticate('jwt', { session: false }),
  authorizeBuyer,
  postProductInquiry
);

// 상품 모든 문의 조회
router.get('/:productId/inquiries', getProductInquiry);

export default router;
