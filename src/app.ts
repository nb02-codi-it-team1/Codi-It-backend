import express from 'express';
import { globalErrorHandler } from './middleware/global-error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
import cors from 'cors';
import indexRouter from './index.routes';
import cookieParser from 'cookie-parser';
import passport from './auth/passport-jwt';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3001',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

// 헬스체크 라우트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', indexRouter);
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
