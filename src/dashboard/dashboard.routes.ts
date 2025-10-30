import { PrismaClient } from '@prisma/client/extension';
import DashboardRepository from './dashboard.repository';
import DashboardService from './dashboard.service';
import DashboardController from './dashboard.controller';
import { Router } from 'express';
import passport from 'passport';
import { authorizeSeller } from 'src/middleware/authorization';

const DashboardRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const dashboardRepository = new DashboardRepository(prisma);
  const dashboardService = new DashboardService(dashboardRepository);
  const dashboardController = new DashboardController(dashboardService);

  /**
   * @swagger
   * /dashboard:
   *   get:
   *     summary: 대시보드 조회
   *     description: 오늘, 주, 월, 년 단위 통계와 top 판매 상품 및 가격대별 매출 정보를 조회합니다.
   *     tags:
   *       - Dashboard
   *     responses:
   *       200:
   *         description: 대시보드 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DashboardResponse'
   */
  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    dashboardController.getDashboard
  );
  return router;
};

export default DashboardRouter;
