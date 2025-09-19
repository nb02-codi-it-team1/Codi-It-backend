import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

export const startCronJobs = (prisma: PrismaClient) => {
  // 매월 1일 0시 0분에 실행되도록 스케줄링
  cron.schedule(
    '0 0 1 * *',
    async () => {
      console.log('월별 관심 스토어 수 초기화 작업 시작');
      try {
        await prisma.store.updateMany({
          data: {
            monthFavoriteCount: 0,
          },
        });
        console.log('월별 관심스토어 수 초기화 완료');
      } catch (error) {
        console.error('월별 좋아요 수 초기화 실패:', error);
      }
    },
    {
      timezone: 'Asia/Seoul',
    }
  );
  console.log('Cron jobs are scheduled.');
};
