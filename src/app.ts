import express from 'express';
import { globalErrorHandler } from './middleware/global-error-handler';
import { notFoundHandler } from './middleware/not-found-handler';

const app = express();

app.use(globalErrorHandler);
app.use(notFoundHandler);

// 헬스체크 라우트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
