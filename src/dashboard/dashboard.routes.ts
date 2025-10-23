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

  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    dashboardController.getDashboard
  );
  return router;
};

export default DashboardRouter;
