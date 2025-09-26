import express from 'express';

import prisma from './common/prisma/client';
import userRouter from './users/user.routes';
import authRouter from './auth/auth.routes';
import StoresRouter from './stores/store.routes';
import reviewRouter from '../review/review.router';

const router = express.Router();

router.use('/users', userRouter);
router.use('/auth', authRouter);
router.use('/stores', StoresRouter(prisma));
router.use('/review', reviewRouter);

export default router;
