import express from 'express';

import prisma from './common/prisma/client';
import userRouter from './users/user.routes';
import authRouter from './auth/auth.routes';
import StoresRouter from './stores/store.routes';
import productRouter from './product/product.route';
import NotificationRouter from './notification/notification.routes';
import InquiryRouter from './inquiry/inquiry.route';
import DashboardRouter from './dashboard/dashboard.routes';
import { NotificationRepository } from './notification/notification.repository';
import { NotificationService } from './notification/notification.service';
import { buildCartRouter } from './cart/cart.routes';
import orderRouter from '../src/order/order.router';
import metadataRouter from '../src/metadata/metadata.router';

const router = express.Router();

const sharedNotificationRepository = new NotificationRepository(prisma);
const sharedNotificationService = new NotificationService(sharedNotificationRepository);

router.use('/users', userRouter);
router.use('/auth', authRouter);
router.use('/products', productRouter(prisma, sharedNotificationService));
router.use('/inquiries', InquiryRouter(prisma, sharedNotificationService));
router.use('/stores', StoresRouter(prisma));
router.use('/notifications', NotificationRouter(prisma, sharedNotificationService));
router.use('/dashboard', DashboardRouter(prisma));
router.use('/cart', buildCartRouter());
router.use('/orders', orderRouter);
router.use('/metadata', metadataRouter);

export default router;
