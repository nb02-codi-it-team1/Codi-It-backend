import 'module-alias/register';
import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { PORT } from './common/constants';
import { startCronJobs } from './common/utils/cron';
import prisma from './common/prisma/client';

dotenv.config();

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startCronJobs(prisma);
});

const KEEP_ALIVE_TIMEOUT_MS = 65000;

server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = KEEP_ALIVE_TIMEOUT_MS + 1000;
