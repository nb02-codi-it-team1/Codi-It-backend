import express from 'express';

import prisma from './common/prisma/client';
import userRouter from './users/user.routes';
import authRouter from './auth/auth.routes';
import StoresRouter from './stores/store.routes';

const router = express.Router();

router.use('/users', userRouter);
router.use('/auth', authRouter);
router.use('/stores', StoresRouter(prisma));

export default router;
