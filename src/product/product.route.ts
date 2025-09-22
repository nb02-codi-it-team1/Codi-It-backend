import passport from 'passport';

import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductDetail,
  getProducts,
  updateProduct,
} from './controller';

const router = Router();

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:productId', getProductDetail);
router.patch('/:productId', updateProduct);
router.delete('/:productId', deleteProduct);

export default router;
