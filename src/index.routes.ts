import express from 'express';

import userRouter from './users/user.routes';
import authRouter from './auth/auth.routes';
import productRouter from './product/product.route';
const router = express.Router();

router.use('/users', userRouter);
router.use('/auth', authRouter);
router.use('/products', productRouter);

export default router;
