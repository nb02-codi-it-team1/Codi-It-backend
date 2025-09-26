import express from 'express';

import prisma from './common/prisma/client';
import userRouter from './users/user.routes';
import authRouter from './auth/auth.routes';
import StoresRouter from './stores/store.routes';
import productRouter from './product/product.route';
import NotificationRouter from './notification/notification.routes';
import inquiryRouter from './inquiry/inquiry.route';

const router = express.Router();

router.use('/users', userRouter);
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/inquiries', inquiryRouter);
router.use('/stores', StoresRouter(prisma));
router.use('/notifications', NotificationRouter(prisma));

export default router;
