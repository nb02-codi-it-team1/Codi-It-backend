import passport from 'passport';
import validateDto from '../common/utils/validate.dto';
import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  getProducts,
  updateProduct,
} from './product.controller';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { authorizeSeller } from 'src/middleware/authorization';

const router = Router();

router.post(
  '/',
  validateDto(CreateProductDto),
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  createProduct
);
router.get('/', getProducts);
router.get('/:productId', getProductDetail);

router.patch(
  '/:productId',
  validateDto(UpdateProductDto),
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  updateProduct
);

router.delete(
  '/:productId',
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  deleteProduct
);

export default router;
