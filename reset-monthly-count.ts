import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetMonthlyCount() {
  try {
    // 모든 스토어의 monthFavoriteCount를 0으로 업데이트
    const result = await prisma.store.updateMany({
      data: {
        monthFavoriteCount: 0,
      },
    });

    console.log(`${result.count}개의 스토어 monthFavoriteCount가 초기화되었습니다.`);
  } catch (error) {
    console.error('월별 좋아요 수 초기화 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetMonthlyCount();
