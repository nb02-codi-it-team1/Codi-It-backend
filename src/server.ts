import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { PORT } from './common/constants';
import { startCronJobs } from './common/utils/cron';
import prisma from './common/prisma/client';

dotenv.config();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startCronJobs(prisma);
});
