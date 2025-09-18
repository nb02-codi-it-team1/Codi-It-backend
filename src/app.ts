import express from 'express';
import { globalErrorHandler } from './middleware/global-error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
import cors from 'cors';
import indexRouter from './index.routes';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// 헬스체크 라우트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', indexRouter);

app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;
