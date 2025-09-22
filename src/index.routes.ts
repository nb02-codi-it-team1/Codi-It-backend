import express from 'express';

import userRouter from './users/user.routes';
import authRouter from './auth/auth.routes';

const router = express.Router();

router.use('/users', userRouter);
router.use('/auth', authRouter);

export default router;
